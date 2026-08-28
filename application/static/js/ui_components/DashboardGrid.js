/******************************************************************************/
/*
 * File:    DashboardGrid.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 *
 * Brief:   Responsive dashboard grid positioning and pointer drag handling.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/
class DashboardGrid {
    /**************************************************************************/
    /*!
        @brief  Constructor.
        @param  gridElem            Dashboard grid element
        @param  updateFunction      Called after a tile has been moved
    */
    /**************************************************************************/
    constructor(gridElem, updateFunction) {
        this.gridElem = gridElem;
        this.updateFunction = updateFunction;
        this.tiles = [];
        this.positions = new Map();
        this.editable = false;
        this.dragState = null;
        this.minimumRows = 6;

        this.pointerMoveHandler = (event) => this.#onPointerMove(event);
        this.pointerUpHandler = (event) => this.#onPointerUp(event);
        this.pointerDownHandler = (event) => this.#onPointerDown(event);
        this.resizeHandler = () => this.render();

        this.gridElem.addEventListener(
            "pointerdown",
            this.pointerDownHandler
        );
        window.addEventListener("resize", this.resizeHandler);
    }

    /**************************************************************************/
    /*!
        @brief  Updates the grid configuration and renders it.
        @param  tiles               Tile configurations
        @param  editable            Whether tiles may be moved
    */
    /**************************************************************************/
    setConfiguration(tiles, editable=false) {
        this.tiles = tiles;
        this.editable = editable;
        this.render();
    }

    /**************************************************************************/
    /*!
        @brief  Renders all explicit grid positions.
    */
    /**************************************************************************/
    render() {
        if (!this.gridElem.isConnected) {
            return;
        }

        const columns = this.getColumnCount();
        this.positions = this.#buildResponsivePositions(columns);
        this.gridElem.style.setProperty("--dashboard-columns", columns);
        this.gridElem.classList.toggle("dashboard-grid-editable", this.editable);

        let highestRow = this.minimumRows;
        for (const tile of this.tiles) {
            const tileElem = this.gridElem.querySelector(
                `[tile-id="${tile.id}"]`
            );
            const position = this.positions.get(String(tile.id));

            if (!tileElem || !position) {
                continue;
            }

            const dimensions = this.getTileDimensions(tile.size, columns);
            this.#applyPosition(tileElem, position, dimensions);
            tileElem.dataset.positionX = position.x;
            tileElem.dataset.positionY = position.y;
            tileElem.classList.toggle("dashboard-tile-draggable", this.editable);
            highestRow = Math.max(
                highestRow,
                position.y + dimensions.rows + 3
            );
        }

        this.gridElem.style.setProperty("--dashboard-rows", highestRow);
        this.#positionAddTile(columns);
    }

    /**************************************************************************/
    /*!
        @brief  Returns the current number of responsive grid columns.
        @return number              Number of columns
    */
    /**************************************************************************/
    getColumnCount() {
        const minimumColumnWidth = 190;
        const gap = 10;
        const availableWidth = Math.max(
            this.gridElem.clientWidth,
            minimumColumnWidth
        );

        return Math.max(
            1,
            Math.floor((availableWidth + gap) / (minimumColumnWidth + gap))
        );
    }

    /**************************************************************************/
    /*!
        @brief  Returns logical grid dimensions for a tile size.
        @param  size                Tile size
        @return object              Column and row span
    */
    /**************************************************************************/
    getTileDimensions(size, availableColumns=undefined) {
        const dimensions = TILE_DIMENSIONS[size] ?? {columns: 1, rows: 1};

        return {
            columns: availableColumns == null ? dimensions.columns :
                Math.min(dimensions.columns, availableColumns),
            rows: dimensions.rows
        };
    }

    /**************************************************************************/
    /*!
        @brief  Finds the first free position for the requested tile size.
        @param  size                Tile size
        @param  ignoredTileId       Tile excluded from collision checks
        @return object              Free X and Y coordinate
    */
    /**************************************************************************/
    findAvailablePosition(size, ignoredTileId=undefined) {
        const columns = this.getColumnCount();
        const dimensions = this.getTileDimensions(size, columns);
        let positionY = 0;

        while (true) {
            for (let positionX = 0;
                    positionX <= columns - dimensions.columns;
                    positionX++) {
                const position = {x: positionX, y: positionY};
                if (!this.#hasCollision(
                    position,
                    dimensions,
                    ignoredTileId
                )) {
                    return position;
                }
            }
            positionY++;
        }
    }

    /**************************************************************************/
    /*!
        @brief  Removes event listeners owned by the grid.
    */
    /**************************************************************************/
    destroy() {
        this.gridElem.removeEventListener(
            "pointerdown",
            this.pointerDownHandler
        );
        window.removeEventListener("resize", this.resizeHandler);
        this.#removeDragListeners();
    }

    /**************************************************************************/
    /*!
        @brief  Builds non-overlapping positions for the current viewport.
        @param  columns             Available columns
        @return Map                 Positions indexed by tile ID
    */
    /**************************************************************************/
    #buildResponsivePositions(columns) {
        const positions = new Map();

        for (const tile of this.tiles) {
            const dimensions = this.getTileDimensions(tile.size, columns);
            const configuredPosition = {
                x: Number.isInteger(tile.position_x) ? Math.min(
                    tile.position_x,
                    columns - dimensions.columns
                ) : 0,
                y: Number.isInteger(tile.position_y) ? tile.position_y : 0
            };
            let position = configuredPosition;

            if (position.x + dimensions.columns > columns ||
                    this.#positionCollides(
                        position,
                        dimensions,
                        positions,
                        columns
                    )) {
                position = this.#findPositionInMap(
                    dimensions,
                    columns,
                    positions,
                    position.y
                );
            }

            positions.set(String(tile.id), position);
        }

        return positions;
    }

    /**************************************************************************/
    /*!
        @brief  Finds a free position inside a supplied position map.
    */
    /**************************************************************************/
    #findPositionInMap(dimensions, columns, positions, preferredPositionY=0) {
        let positionY = preferredPositionY;

        while (true) {
            for (let positionX = 0;
                    positionX <= columns - dimensions.columns;
                    positionX++) {
                const position = {x: positionX, y: positionY};
                if (!this.#positionCollides(
                    position,
                    dimensions,
                    positions,
                    columns
                )) {
                    return position;
                }
            }
            positionY++;
        }
    }

    /**************************************************************************/
    /*!
        @brief  Checks a position against positions already assigned.
    */
    /**************************************************************************/
    #positionCollides(position, dimensions, positions, columns) {
        for (const [tileId, tilePosition] of positions.entries()) {
            const tile = this.tiles.find(
                (item) => String(item.id) === tileId
            );
            const tileDimensions = this.getTileDimensions(
                tile?.size,
                columns
            );

            if (this.#rectanglesOverlap(
                position,
                dimensions,
                tilePosition,
                tileDimensions
            )) {
                return true;
            }
        }

        return false;
    }

    /**************************************************************************/
    /*!
        @brief  Applies a logical position to a tile element.
    */
    /**************************************************************************/
    #applyPosition(tileElem, position, dimensions) {
        tileElem.style.gridColumn = `${position.x + 1} / span ${dimensions.columns}`;
        tileElem.style.gridRow = `${position.y + 1} / span ${dimensions.rows}`;
    }

    /**************************************************************************/
    /*!
        @brief  Places the add button in the first free cell.
    */
    /**************************************************************************/
    #positionAddTile() {
        const addTileElem = document.getElementById("tile-add");
        if (!addTileElem || !this.gridElem.contains(addTileElem)) {
            return;
        }

        const position = this.findAvailablePosition(TILE_SIZE_1X1);
        this.#applyPosition(
            addTileElem,
            position,
            this.getTileDimensions(TILE_SIZE_1X1)
        );
    }

    /**************************************************************************/
    /*!
        @brief  Starts tracking a possible pointer drag.
        @param  event               Pointer event
    */
    /**************************************************************************/
    #onPointerDown(event) {
        if (!this.editable || event.button > 0) {
            return;
        }
        if (event.target.closest("button, input, label, select, a")) {
            return;
        }

        const tileElem = event.target.closest("[tile-id]");
        if (!tileElem || !this.gridElem.contains(tileElem)) {
            return;
        }

        const tileId = tileElem.getAttribute("tile-id");
        const tile = this.tiles.find((item) => String(item.id) === tileId);
        if (!tile) {
            return;
        }

        this.dragState = {
            tile: tile,
            tileElem: tileElem,
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            currentPosition: this.positions.get(tileId),
            dragging: false
        };
        tileElem.setPointerCapture?.(event.pointerId);
        window.addEventListener("pointermove", this.pointerMoveHandler, {
            passive: false
        });
        window.addEventListener("pointerup", this.pointerUpHandler);
        window.addEventListener("pointercancel", this.pointerUpHandler);
    }

    /**************************************************************************/
    /*!
        @brief  Moves the visual tile and updates the drop preview.
        @param  event               Pointer event
    */
    /**************************************************************************/
    #onPointerMove(event) {
        if (!this.dragState || event.pointerId !== this.dragState.pointerId) {
            return;
        }
        console.log("test")

        const deltaX = event.clientX - this.dragState.startX;
        const deltaY = event.clientY - this.dragState.startY;
        if (!this.dragState.dragging && Math.hypot(deltaX, deltaY) < 6) {
            return;
        }

        event.preventDefault();
        this.dragState.dragging = true;
        this.dragState.tileElem.classList.add("dashboard-tile-dragging");
        this.dragState.tileElem.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;

        const position = this.#getPointerPosition(event);
        const dimensions = this.getTileDimensions(
            this.dragState.tile.size,
            this.getColumnCount()
        );
        const valid = !this.#hasCollision(
            position,
            dimensions,
            this.dragState.tile.id
        );
        this.#showDropPreview(position, dimensions, valid);

        if (valid) {
            this.dragState.currentPosition = position;
        }

        if (event.clientY > window.innerHeight - 60) {
            window.scrollBy({top: 12, behavior: "auto"});
        } else if (event.clientY < 60) {
            window.scrollBy({top: -12, behavior: "auto"});
        }
    }

    /**************************************************************************/
    /*!
        @brief  Finishes a drag and persists one final position.
        @param  event               Pointer event
    */
    /**************************************************************************/
    async #onPointerUp(event) {
        if (!this.dragState || event.pointerId !== this.dragState.pointerId) {
            return;
        }

        const dragState = this.dragState;
        this.dragState = null;
        this.#removeDragListeners();
        this.#hideDropPreview();
        dragState.tileElem.classList.remove("dashboard-tile-dragging");
        dragState.tileElem.style.transform = "";

        if (!dragState.dragging || !dragState.currentPosition) {
            return;
        }

        const oldPosition = this.positions.get(String(dragState.tile.id));
        if (oldPosition.x === dragState.currentPosition.x &&
            oldPosition.y === dragState.currentPosition.y) {
            return;
        }

        const oldConfiguredPosition = {
            x: dragState.tile.position_x,
            y: dragState.tile.position_y
        };
        dragState.tile.position_x = dragState.currentPosition.x;
        dragState.tile.position_y = dragState.currentPosition.y;
        this.positions.set(
            String(dragState.tile.id),
            dragState.currentPosition
        );
        this.render();
        const success = await this.updateFunction(
            dragState.tile.id,
            dragState.currentPosition.x,
            dragState.currentPosition.y
        );

        if (success === false) {
            dragState.tile.position_x = oldConfiguredPosition.x;
            dragState.tile.position_y = oldConfiguredPosition.y;
            this.render();
        }
    }

    /**************************************************************************/
    /*!
        @brief  Maps a pointer coordinate to a grid coordinate.
        @param  event               Pointer event
    */
    /**************************************************************************/
    #getPointerPosition(event) {
        const rectangle = this.gridElem.getBoundingClientRect();
        const columns = this.getColumnCount();
        const gap = 10;
        const rowHeight = 45;
        const columnWidth = (rectangle.width - gap * (columns - 1)) / columns;
        const dimensions = this.getTileDimensions(this.dragState.tile.size, columns);
        const positionX = Math.floor(
            (event.clientX - rectangle.left) / (columnWidth + gap)
        );
        const positionY = Math.floor(
            (event.clientY - rectangle.top) / (rowHeight + gap)
        );

        return {
            x: Math.max(
                0,
                Math.min(columns - dimensions.columns, positionX)
            ),
            y: Math.max(0, positionY)
        };
    }

    /**************************************************************************/
    /*!
        @brief  Checks whether a candidate overlaps another tile.
    */
    /**************************************************************************/
    #hasCollision(position, dimensions, ignoredTileId=undefined) {
        for (const tile of this.tiles) {
            if (String(tile.id) === String(ignoredTileId)) {
                continue;
            }

            const tilePosition = this.positions.get(String(tile.id));
            if (!tilePosition) {
                continue;
            }

            if (this.#rectanglesOverlap(
                position,
                dimensions,
                tilePosition,
                this.getTileDimensions(tile.size, this.getColumnCount())
            )) {
                return true;
            }
        }

        return false;
    }

    /**************************************************************************/
    /*!
        @brief  Checks whether two logical rectangles overlap.
    */
    /**************************************************************************/
    #rectanglesOverlap(firstPosition, firstDimensions, secondPosition, secondDimensions) {
        return firstPosition.x < secondPosition.x + secondDimensions.columns &&
            firstPosition.x + firstDimensions.columns > secondPosition.x &&
            firstPosition.y < secondPosition.y + secondDimensions.rows &&
            firstPosition.y + firstDimensions.rows > secondPosition.y;
    }

    /**************************************************************************/
    /*!
        @brief  Shows the valid or invalid target cells.
    */
    /**************************************************************************/
    #showDropPreview(position, dimensions, valid) {
        let previewElem = this.gridElem.querySelector(
            ".dashboard-drop-preview"
        );
        if (!previewElem) {
            previewElem = document.createElement("div");
            previewElem.className = "dashboard-drop-preview";
            this.gridElem.appendChild(previewElem);
        }

        previewElem.classList.toggle("invalid", !valid);
        this.#applyPosition(previewElem, position, dimensions);
        this.gridElem.style.setProperty(
            "--dashboard-rows",
            Math.max(
                this.minimumRows,
                position.y + dimensions.rows + 3
            )
        );
    }

    /**************************************************************************/
    /*!
        @brief  Removes the target cell preview.
    */
    /**************************************************************************/
    #hideDropPreview() {
        this.gridElem.querySelector(".dashboard-drop-preview")?.remove();
    }

    /**************************************************************************/
    /*!
        @brief  Removes temporary window drag listeners.
    */
    /**************************************************************************/
    #removeDragListeners() {
        window.removeEventListener("pointermove", this.pointerMoveHandler);
        window.removeEventListener("pointerup", this.pointerUpHandler);
        window.removeEventListener("pointercancel", this.pointerUpHandler);
    }
}
