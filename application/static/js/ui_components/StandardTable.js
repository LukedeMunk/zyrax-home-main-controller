/******************************************************************************/
/*
 * File:    StandardTable.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   Standard table class to generate and update table DOM elements.
 * 
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 * 
 * Template version:        0.0.4
 * Template information:    https://github.com/LukedeMunk/templates
 */
/******************************************************************************/
//#region Constants
const CELL_TYPE_TEXT = 0;
const CELL_TYPE_OPTIONS = 1;
const CELL_TYPE_ICON = 2;
const CELL_TYPE_HTML = 3;
const CELL_TYPE_TOGGLEABLE_INPUT = 4;
const CELL_TYPE_IMAGE = 5;
const CELL_TYPE_CHECKBOX = 6;
const CELL_TYPE_INPUT = 7;
const CELL_TYPE_SELECT_INPUT = 8;
const CELL_TYPE_RADIO_BUTTON = 9;

const TABLE_SORTING_ASCENDING = 0;
const TABLE_SORTING_DESCENDING = 1;
const TABLE_SORTING_DEFAULT = 2;
//#endregion

//#region Example configuration /*X*/ = required
//const EXAMPLE_TABLE_CONFIGURATION = {
//    id: "exampleTable",
//    maxHeight: "500px",
//    title: "Example table",
//    canBeSorted: true,
//    /*X*/columns: [
//        {
//            /*X*/title: "Example column 1",
//            /*X*/width: "10%",
//            mobileWidth: "10%",
//            canBeSorted: true,
//            visible: true,
//            vertical: true,
//            filterOptions: [
//                {value: 0, text: "filter0", icon: "fa-solid fa-circle-exclamation fa-lg"},
//                {value: 1, text: "filter1", icon: "fa-solid fa-screwdriver-wrench fa-lg"},
//            ]
//        },
//        {
//            /*X*/title: "Example column 2",
//            /*X*/width: "10%",
//            mobileWidth: "10%",
//            canBeSorted: true,
//            visible: true,
//            vertical: false,
//            icons: [
//                {icon: "fa-solid fa-screwdriver-wrench fa-lg", onclickFunction: ()=> exampleFunction()},
//            ]
//        },
//        {
//            /*X*/title: "Example column 3",
//            /*X*/width: "10%",
//            mobileWidth: "10%",
//            canBeSorted: false,
//            visible: true,
//            vertical: false
//        },
//        {
//            /*X*/title: "Example column 4",
//            /*X*/width: "10%",
//            mobileWidth: "10%",
//            canBeSorted: false,
//            visible: true,
//            vertical: false
//        },
//        {
//            /*X*/title: "Example column 5",
//            /*X*/width: "10%",
//            mobileWidth: "10%",
//            canBeSorted: false,
//            visible: true,
//            vertical: false
//        },
//        {
//            /*X*/title: "Example column 6",
//            /*X*/width: "10%",
//            mobileWidth: "10%",
//            canBeSorted: false,
//            visible: true,
//            vertical: false
//        },
//        {
//            /*X*/title: "Example column 7",
//            /*X*/width: "10%",
//            mobileWidth: "10%",
//            canBeSorted: false,
//            visible: true,
//            vertical: false
//        },
//        {
//            /*X*/title: "Example column 8",
//            /*X*/width: "10%",
//            mobileWidth: "10%",
//            canBeSorted: false,
//            visible: true,
//            vertical: false
//        },
//        {
//            /*X*/title: "Example column 9",
//            /*X*/width: "10%",
//            mobileWidth: "10%",
//            canBeSorted: false,
//            visible: true,
//            vertical: false
//        },
//        {
//            /*X*/title: "Example column 10",
//            /*X*/width: "10%",
//            mobileWidth: "10%",
//            canBeSorted: false,
//            visible: true,
//            vertical: false
//        },
//    ],
//    headerIcons: [
//        {
//            id: "headerIcon1",
//            /*X*/icon: "fa-duotone fa-solid fa-plus fa-lg",
//            onclickFunction: ()=> exampleFunction(),
//            title: "Example icon"
//        },
//    ],
//    noRowsMessage: "Now rows for the example table",
//    inputIdPrefix: "inputExampleTable",
//    updateOrderingFunction: () => orderItems(),                               //For tables with ordering numbers
//};
//
//const EXAMPLE_TABLE_ROW = {
//    configuration: {
//        title: "Example title",
//        className: "",
//        backgroundColor: "",
//        onclick: () => exampleOnclick(),
//    },
//    /*X*/data: [
//        {
//            /*X*/type: CELL_TYPE_TEXT,
//            value: "Example text row",
//            textLabel: "Is shown in table instead of value when defined",
//            icons: [
//                {
//                    id: "exampleOption",
//                    icon: "fa-duotone fa-solid fa-floppy-disk fa-lg",
//                    title: "",
//                    color: "",
//                    onclickFunction: undefined
//                }
//            ]
//        },
//        {
//            /*X*/type: CELL_TYPE_OPTIONS,
//            options: [
//                {
//                    id: "exampleOption",
//                    icon: "fa-duotone fa-solid fa-floppy-disk fa-lg",
//                    title: "",
//                    onclickFunction: undefined
//                }
//            ]
//        },
//        {
//            /*X*/type: CELL_TYPE_ICON,
//            value: "",
//            icon: {
//                id: "exampleIcon",
//                icon: "fa-duotone fa-solid fa-floppy-disk fa-lg",
//                color: "red",
//                title: "exampleIcon",
//                onclickFunction: () => example()
//            }
//        },
//        {
//            /*X*/type: CELL_TYPE_HTML,
//            value: ""
//        },
//        {
//            /*X*/type: CELL_TYPE_TOGGLEABLE_INPUT,
//            value: "",
//            inputType: "textarea",
//            options: [],
//            saveFunction: () => updateDescription(descriptionId),
//            itemIdKey: "description-id",
//            itemIdValue: ""
//        },
//        {
//            /*X*/type: CELL_TYPE_IMAGE,
//            id: "exampleImage",
//            /*X*/src: "https://fastly.picsum.photos/id/179/200/300.jpg?hmac=oo9H3-mvUxV9CjfSms5helxQW-n5PsZLzkg1ko78uFk",
//        },
//        {
//            /*X*/type: CELL_TYPE_CHECKBOX,
//            id: "exampleCb",
//            checked: true,
//            title: "example",
//            disabled: false,
//            onclickFunction: undefined
//        },
//        {
//            /*X*/type: CELL_TYPE_INPUT,
//            id: "materialNameTxt",
//            inputType: "text",
//            value: "",
//            onchangeFunction: () => updateMaterial(material.id)
//        },
//        {
//            /*X*/type: CELL_TYPE_SELECT_INPUT,
//            id: "exampleSelect",
//            value: 0,
//            invalid: false,
//            onchangeFunction: () => example()
//        },
//        {
//            /*X*/type: CELL_TYPE_RADIO_BUTTON,
//            /*X*/name: "rbGroupName",
//            id: "exampleRb",
//            checked: true,
//            title: "Example radiobutton",
//            disabled: false
//        }
//    ]
//};
//#endregion

class StandardTable {
    /******************************************************************************/
    /*!
        @brief  Constructor.
        @param  targetElement       Container DOM element to put the table in
        @param  configuration       Table structure and configuration
    */
    /******************************************************************************/
    constructor(targetElement, configuration=undefined) {
        if (targetElement == null) {
            console.error("Table container does not exist");
            return;
        }

        if (targetElement.tagName == "TABLE") {
            this.containerElem = targetElement;
        } else {
            this.containerElem = document.createElement("table");
            this.containerElem.className = "scrollable-table-container-table";
            targetElement.appendChild(this.containerElem);
        }
        
        if (configuration != undefined) {
            this.setConfiguration(configuration);
        }
    }

    /******************************************************************************/
    /*!
        @brief  Sets the structure and configuration of the table.
        @param  configuration       Table structure and configuration
    */
    /******************************************************************************/
    setConfiguration(configuration) {
        this.columns = configuration.columns;
        this.maxHeight = configuration.maxHeight ?? "500px";

        this.id = configuration.id ?? "standardTable";
        this.containerId = this.containerElem.id ?? this.id + "Container";          //Ensure the container has an ID
        this.containerElem.id = this.containerId;
        this.titleId = this.id + "Title";
        this.headerId = this.id + "Header";
        this.scrollBodyId = this.id + "Body";

        this.title = configuration.title ?? "";
        this.headerIcons = configuration.headerIcons ?? [];
        this.noRowsMessage = configuration.noRowsMessage ?? "";
        this.inputIdPrefix = configuration.inputIdPrefix ?? "";
        this.rows = [];
        this.filterMenus = [];
        this.currentSearchText = "";

        this.updateOrderingFunction = configuration.updateOrderingFunction ?? null;
        this.isOrderedTable = this.updateOrderingFunction != null;
        this.canBeOrdered = configuration.canBeOrdered ?? true;
        this.canBeOrderedConfiguration = configuration.canBeOrdered ?? true;
        this.togglableInputSaveFunctions = [];

        this.canBeSorted = false;
        if (!this.isOrderedTable) {
            this.canBeSorted = configuration.canBeSorted ?? true;
        }

        for (let column of this.columns) {
            column.originalWidth = column.width;
            column.visible = column.visible ?? true;

            if (this.canBeSorted) {
                column.sortingOption = TABLE_SORTING_DEFAULT;
                column.sorted = false;
                column.canBeSorted = column.canBeSorted ?? true;
            }
        }

        this.reset();
    }

    /******************************************************************************/
    /*!
        @brief  Resets the table rows.
    */
    /******************************************************************************/
    reset() {
        const tableElem = document.getElementById(this.scrollBodyId);
        if (tableElem != null) {
            this.scrollTop = tableElem.scrollTop;
        } else {
            this.scrollTop = 0;
        }

        this.containerElem.innerHTML = "";
        this.rows = [];
        this.togglableInputSaveFunctions = [];
        this.canBeOrdered = this.canBeOrderedConfiguration;

        for (let element of this.filterMenus) {
            document.getElementById(element.id).remove();
        }

        this.filterMenus = [];
        this.#generateHeader();
    }

    /******************************************************************************/
    /*!
        @brief  Saves the scroll position before a table reset.
    */
    /******************************************************************************/
    saveScrollPosition() {
        const tableElem = document.getElementById(this.scrollBodyId);
        this.scrollTop = tableElem.scrollTop;
    }

    /******************************************************************************/
    /*!
        @brief  Resets the scroll position after a table reset.
    */
    /******************************************************************************/
    restoreScrollPosition() {
        const tableElem = document.getElementById(this.scrollBodyId);
        tableElem.scrollTop = this.scrollTop;
    }

    /******************************************************************************/
    /*!
        @brief  Appends the specified row to the table.
        @param  row                 Row to add
    */
    /******************************************************************************/
    appendRow(row) {
        const tableElem = document.getElementById(this.id);
        let numberOfRows = tableElem.rows.length;

        if (row.configuration == undefined) {
            row.configuration = {};
        }

        const rowElem = tableElem.insertRow();
        rowElem.title = row.configuration.title ?? "";
        rowElem.className = row.configuration.class ?? "";
        rowElem.style.backgroundColor = row.configuration.backgroundColor ?? "";
        rowElem.onclick = row.configuration.onclickFunction ?? null;

        if (this.isOrderedTable) {
            rowElem.draggable = true;

            rowElem.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("text/plain", rowElem.dataset.index);
                rowElem.classList.add("dragging");
            });

            rowElem.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            rowElem.addEventListener("dragenter", () => {
                rowElem.classList.add("drag-over");
            });

            rowElem.addEventListener("dragleave", () => {
                rowElem.classList.remove("drag-over");
            });
            rowElem.addEventListener("dragend", () => {
                rowElem.classList.remove("dragging");
            });

            rowElem.addEventListener("drop", (e) => {
                e.preventDefault();
                rowElem.classList.remove("drag-over");

                const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
                const toIndex = parseInt(rowElem.dataset.index);

                this.#moveRow(fromIndex, toIndex);
            });
        }

        let index = 0;
        for (let cell of row.data) {
            if (!this.columns[index].visible) {
                index++;
                continue;
            }

            const cellElem = rowElem.insertCell();
            if (MOBILE_VERSION && this.columns[index].mobileWidth != undefined) {
                cellElem.style.width = this.columns[index].mobileWidth;
            } else {
                cellElem.style.width = this.columns[index].width;
            }
            
            /* Text and/or icons */
            if (cell.type == CELL_TYPE_TEXT) {
                cellElem.appendChild(this.#generateTextIconsCell(cell));
            }

            /* Checkbox */
            if (cell.type == CELL_TYPE_CHECKBOX) {
                cellElem.appendChild(this.#generateCheckboxCell(cell));
            }

            /* Radio button */
            if (cell.type == CELL_TYPE_RADIO_BUTTON) {
                cellElem.appendChild(this.#generateRadioButtonCell(cell));
            }

            /* Input */
            if (cell.type == CELL_TYPE_INPUT) {
                cellElem.appendChild(this.#generateInputCell(cell));
            }

            /* Input */
            if (cell.type == CELL_TYPE_SELECT_INPUT) {
                cellElem.appendChild(this.#generateSelectInputCell(cell));
            }

            /* Icon */
            if (cell.type == CELL_TYPE_ICON) {
                cellElem.appendChild(this.#generateIconCell(cell));
            }

            /* Image */
            if (cell.type == CELL_TYPE_IMAGE) {
                cellElem.appendChild(this.#generateImageCell(cell));
            }

            /* HTML */
            if (cell.type == CELL_TYPE_HTML) {
                cellElem.innerHTML = cell.value;
            }

            /* Toggleable input */
            if (cell.type == CELL_TYPE_TOGGLEABLE_INPUT) {
                const localIndex = index;
                cellElem.appendChild(this.#generateToggleableInputCell(cell, (1+numberOfRows)*(1+localIndex)));
            }

            /* Option icons */
            if (cell.type == CELL_TYPE_OPTIONS) {
                cellElem.appendChild(this.#generateTableOptionsCell(cell.options));
            }

            index++;
        }

        if (row.visible == undefined) {
            row.visible = true;
            this.rows.push(row);
        }

        rowElem.dataset.index = this.rows.length - 1;
        return rowElem;
    }

    /******************************************************************************/
    /*!
        @brief  Appends an empty row to the table.
        @param  message         Message to show
    */
    /******************************************************************************/
    appendEmptyTableRow(message=undefined) {
        if (message != undefined) {
            this.noRowsMessage = message;
        }
        
        const tableElem = document.getElementById(this.id);

        const rowElem = document.createElement("tr");
        const cellElem = document.createElement("td");
        cellElem.style.textAlign = "center";
        cellElem.colSpan = this.columns.length;
        cellElem.textContent = this.noRowsMessage;

        rowElem.appendChild(cellElem);
        tableElem.appendChild(rowElem);
    }

    /******************************************************************************/
    /*!
        @brief  Appends a row with loading icon to the table.
        @param  message         Message to show
    */
    /******************************************************************************/
    appendLoadingTableRow(message="") {
        const tableElem = document.getElementById(this.id);

        const rowElem = document.createElement("tr");
        const cellElem = document.createElement("td");

        cellElem.colSpan = this.columns.length;

        const flexCell = document.createElement("div");
        flexCell.className = "cell-flex";
        flexCell.style.justifyContent = "center";

        const loadingIconElem = document.createElement("div");
        loadingIconElem.className = "dot-loader";

        const loadingMessageElem = document.createElement("p");
        loadingMessageElem.textContent = message;

        flexCell.appendChild(loadingIconElem);
        flexCell.appendChild(loadingMessageElem);
        cellElem.appendChild(flexCell);

        rowElem.appendChild(cellElem);
        tableElem.appendChild(rowElem);
    }

    /******************************************************************************/
    /*!
        @brief  Appends an add item row to the table.
        @param  onclickFunction     Function to be executed on click
        @param  title               Text in the row
    */
    /******************************************************************************/
    appendAddRow(onclickFunction, title=undefined) {
        const tableElem = document.getElementById(this.id);

        const rowElem = document.createElement("tr");
        const cellElem = document.createElement("td");
        cellElem.style.textAlign = "center";
        cellElem.colSpan = this.columns.length;
        cellElem.style.cursor = "pointer";
        cellElem.style.backgroundColor = "var(--background4)";
        cellElem.onclick = onclickFunction ?? null;

        const iconElem = document.createElement("i");
        iconElem.className = "fa-duotone fa-solid fa-plus fa-lg";
        iconElem.title = title;

        cellElem.appendChild(iconElem);
        rowElem.appendChild(cellElem);
        tableElem.appendChild(rowElem);
    }

    /******************************************************************************/
    /*!
        @brief  Toggles the specified column visibility.
        @param  columnIndex         Index of the column
        @param  show                True to show the column
    */
    /******************************************************************************/
    toggleColumnVisibility(columnIndex, show=undefined) {
        if (show == undefined) {
            this.columns[columnIndex].visible = !this.columns[columnIndex].visible
        } else {
            this.columns[columnIndex].visible = show;
        }

        this.#recalculateColumnWidths();

        this.saveScrollPosition();
        this.containerElem.innerHTML = "";
        this.#generateHeader();
        this.#generateBody();
    }

    /******************************************************************************/
    /*!
        @brief  Recalculates the column widths after a column visibility change has
                happened.
    */
    /******************************************************************************/
    #recalculateColumnWidths() {
        /* Reset widths */
        for (let column of this.columns) {
            column.width = column.originalWidth;
        }

        /* Calculate */
        for (let i = 0; i < this.columns.length; i++) {
            let column = this.columns[i];

            if (column.visible === false) {
                const hiddenWidth = parseFloat(column.originalWidth);

                let targetIndex = -1;

                /* First try left */
                for (let j = i - 1; j >= 0; j--) {
                    if (this.columns[j].visible !== false) {
                        targetIndex = j;
                        break;
                    }
                }

                /* If no visible column on the left, try right */
                if (targetIndex === -1) {
                    for (let j = i + 1; j < this.columns.length; j++) {
                        if (this.columns[j].visible !== false) {
                            targetIndex = j;
                            break;
                        }
                    }
                }

                if (targetIndex !== -1) {
                    const targetWidth = parseFloat(
                        this.columns[targetIndex].width
                    );

                    this.columns[targetIndex].width =
                        (targetWidth + hiddenWidth) + "%";
                }

                column.width = "0%";
            }
        }
    }

    /******************************************************************************/
    /*!
        @brief  Sets the filter options of the specified column.
        @param  columnIndex         Index of the column
        @param  filterOptions       Filter options to set
    */
    /******************************************************************************/
    setColumnFilterOptions(columnIndex, filterOptions) {
        this.columns[columnIndex].filterOptions = filterOptions;
    }

    /******************************************************************************/
    /*!
        @brief  Toggles the specified column filter and applies the filter.
        @param  columnIndex         Index of the column
        @param  filterOptionValue   Filter value to toggle
    */
    /******************************************************************************/
    toggleColumnFilter(columnIndex, filterOptionValue) {
        let filterOptionIndex = getIndexFromId(this.columns[columnIndex].filterOptions, filterOptionValue, "value");
        let filterOption = this.columns[columnIndex].filterOptions[filterOptionIndex];

        filterOption.selected = !filterOption.selected;
        
        this.#applyFiltersAndSearch(this.currentSearchText);
        this.#updateFilterIcon(columnIndex);
    }

    /******************************************************************************/
    /*!
        @brief  Toggles the specified column sorting and applies the sorting.
        @param  columnIndex         Index of the column
    */
    /******************************************************************************/
    toggleColumnSorting(columnIndex) {
        const column = this.columns[columnIndex];
        column.sorted = true;
        
        if (column.sortingOption == TABLE_SORTING_ASCENDING) {
            column.sortingOption = TABLE_SORTING_DESCENDING;
        } else if (column.sortingOption == TABLE_SORTING_DESCENDING) {
            column.sortingOption = TABLE_SORTING_DEFAULT;
        } else {
            column.sortingOption = TABLE_SORTING_ASCENDING;
        }

        this.#applyFiltersAndSearch(this.currentSearchText);
        this.#updateSortingIcon(columnIndex);
    }

    /******************************************************************************/
    /*!
        @brief  Searches the table by the specified query and enabled filters.
        @param  query               Query to use
        @return                     Number of results
    */
    /******************************************************************************/
    search(query) {
        this.currentSearchText = query;
        return this.#applyFiltersAndSearch(query);
    }
    
    /******************************************************************************/
    /*!
        @brief  Sets the table title.
        @param  title               Title to set
    */
    /******************************************************************************/
    setTitle(title) {
        let titleElem = document.getElementById(this.titleId);
        this.title = title;
        titleElem.textContent = this.title;
    }

    /******************************************************************************/
    /*!
        @brief  Shows the specified filter menu.
        @param  menu                Menu to show
    */
    /******************************************************************************/
    showMenu(index) {
        this.filterMenus.forEach(menu => this.hideMenu(menu));                      //Close menus

        let menu = this.filterMenus.find(m => m.index === index);

        const menuElem = document.getElementById(menu.id);
        const iconElem = document.getElementById(this.id + "FilterIcon" + index);
        const rect = iconElem.getBoundingClientRect();
        menuElem.style.left = `${rect.left}px`;
        menuElem.style.top = `${rect.bottom}px`;

        menuElem.classList.add("show");

        menu.open = true;
    }

    /******************************************************************************/
    /*!
        @brief  Hides the specified filter menu.
        @param  menu                Menu to hide
    */
    /******************************************************************************/
    hideMenu(menu) {
        const menuElem = document.getElementById(menu.id);
        menuElem.classList.remove("show");
        menu.open = false;
    }

    /******************************************************************************/
    /*!
        @brief  Moves the row with the specified index to the specified index.
        @param  fromIndex           Index of the row to move
        @param  toIndex             Index to move the row to
    */
    /******************************************************************************/
    #moveRow(fromIndex, toIndex) {
        if (!this.canBeOrdered) {
            banners.show(TEXT_WARNING, TEXT_CANNOT_MOVE_WHEN_TABLE_IS_FILTERED, MESSAGE_TYPE_WARNING);
            return;
        }

        if (fromIndex === toIndex) return;

        const movedItem = this.rows.splice(fromIndex, 1)[0];
        this.rows.splice(toIndex, 0, movedItem);

        this.saveScrollPosition();
        this.#generateBody();
        this.#syncRowIndices();
        
        this.updateOrderingFunction(fromIndex, toIndex);
    }

    /******************************************************************************/
    /*!
        @brief  Updates row indices after row reordering.
    */
    /******************************************************************************/
    #syncRowIndices() {
        const tableElem = document.getElementById(this.id);

        Array.from(tableElem.rows).forEach((rowElem, index) => {
            rowElem.dataset.index = index;
        });
    }

    /******************************************************************************/
    /*!
        @brief  Passes the specified row through all active filters and returns
                whether the row matches the current filter criteria.
        @param  row                 Row to check
        @return                     True when the row passes the filters
    */
    /******************************************************************************/
    #filterCheck(row) {
        return this.columns.every((column, colIndex) => {
            const filters = column.filterOptions;
            if (!filters) return true;

            const active = filters.filter(f => f.selected);
            if (active.length === 0) return true;

            const value = row.data[colIndex]?.value;

            return active.some(f => f.value == value);
        });
    }

    /******************************************************************************/
    /*!
        @brief  Checks if the specified row contains the specified query.
        @param  row                 Row to check
        @param  query               Query to search for
        @return                     True when the row contains the query
    */
    /******************************************************************************/
    #searchCheck(row, query) {
        if (!query) return true;

        return row.data.some(cell => {
            let text = String(cell.value);

            /* If cell.value contains a DOM-element or HTML-string */
            if (cell.type === CELL_TYPE_HTML || cell.type === CELL_TYPE_TEXT || cell.type === CELL_TYPE_TOGGLEABLE_INPUT) {
                /* Create temporary container to read innerText */
                const wrapper = document.createElement("div");
                wrapper.innerHTML = text;
                text = wrapper.innerText || "";
            }

            return text.toLowerCase().includes(query);//TODO make non lowercase option
        });
    }

    /******************************************************************************/
    /*!
        @brief  Searches the table based on the query and filters.
        @param  query               Query to search for
        @return                     Number of search results
    */
    /******************************************************************************/
    #applyFiltersAndSearch(query) {
        this.saveScrollPosition();

        let index = 0;
        for (let row of this.rows) {
            const matchesFilter = this.#filterCheck(row);
            const matchesSearch = this.#searchCheck(row, query);

            row.visible = matchesFilter && matchesSearch;

            if (this.canBeSorted && row.originalIndex == undefined) {
                row.originalIndex = index;
            }
            index++;
        }

        this.#applySorting();

        let numberOfRows = this.#generateBody();
        this.#syncRowIndices();
        return numberOfRows;
    }

    /******************************************************************************/
    /*!
        @brief  Applies the sorting in the table.
    */
    /******************************************************************************/
    #applySorting() {
        if (!this.canBeSorted) {
            return;
        }

        const sortedColumns = this.columns
                                        .map((col, index) => ({ col, index }))
                                        .filter(x => x.col.sorted);

        if (sortedColumns.length === 0) {
            return;
        }

        this.rows.sort((a, b) => {
            for (const { col, index } of sortedColumns) {
                const sortingOption = col.sortingOption;

                const rawA = a.data[index]?.value ?? "";
                const rawB = b.data[index]?.value ?? "";

                const valueA = String(rawA).trim();
                const valueB = String(rawB).trim();

                /* Restore original order */
                if (sortingOption === TABLE_SORTING_DEFAULT) {
                    col.sorted = false;
                    return a.originalIndex - b.originalIndex;
                }

                const isNumericA = valueA !== "" && !isNaN(valueA);
                const isNumericB = valueB !== "" && !isNaN(valueB);

                let result = 0;

                /* numeric compare */
                if (isNumericA && isNumericB) {
                    const numA = Number(valueA);
                    const numB = Number(valueB);

                    result =
                        sortingOption === TABLE_SORTING_ASCENDING
                            ? numA - numB
                            : numB - numA;
                }
                /* string compare */
                else {
                    result =
                        sortingOption === TABLE_SORTING_ASCENDING
                            ? valueA.localeCompare(valueB)
                            : valueB.localeCompare(valueA);
                }

                /* if not equal → stop here */
                if (result !== 0) {
                    return result;
                }
            }

            return 0;
        });
    }

    /******************************************************************************/
    /*!
        @brief  Updates the sorting icon of the specified column.
        @param  columnIndex         Index of the column
    */
    /******************************************************************************/
    #updateSortingIcon(columnIndex) {
        const iconElem = document.getElementById(this.id + "SortingIcon" + columnIndex);

        if (this.columns[columnIndex].sortingOption == TABLE_SORTING_ASCENDING) {
            iconElem.className = "fa-duotone fa-solid fa-arrow-down-short-wide clickable filter-icon";
            iconElem.title = TEXT_CLICK_TO_SORT_DESCENDING;
        } else if (this.columns[columnIndex].sortingOption == TABLE_SORTING_DESCENDING) {
            iconElem.className = "fa-duotone fa-solid fa-arrow-up-short-wide clickable filter-icon";
            iconElem.title = TEXT_CLICK_FOR_DEFAULT_SORTING;
        } else {
            iconElem.className = "fa-duotone fa-solid fa-arrow-down-arrow-up clickable filter-icon";
            iconElem.title = TEXT_CLICK_TO_SORT;
        }
    }

    /******************************************************************************/
    /*!
        @brief  Updates the filter icon of the specified column.
        @param  columnIndex         Index of the column
    */
    /******************************************************************************/
    #updateFilterIcon(columnIndex){
        if (!this.columns[columnIndex].filterOptions) {
            return;
        }

        const iconElem = document.getElementById(this.id + "FilterIcon" + columnIndex);

        if (this.columns[columnIndex].filterOptions.some(f => f.selected)) {
            iconElem.className = "fa-duotone fa-solid fa-filter-list clickable filter-icon";
        } else {
            iconElem.className = "fa-duotone fa-solid fa-filter clickable filter-icon";
        }
    }

    /******************************************************************************/
    /*!
        @brief  Generates the table body.
    */
    /******************************************************************************/
    #generateBody() {
        const tableElem = document.getElementById(this.id);
        tableElem.innerHTML = "";

        let numberOfRows = 0;
        for (let row of this.rows) {
            if (row.visible) {
                this.appendRow(row);
                numberOfRows++;
            }
        }

        if (numberOfRows == this.rows.length) {
            this.canBeOrdered = true;
        } else {
            this.canBeOrdered = false;
        }

        if (numberOfRows == 0) {
            this.appendEmptyTableRow();
        }

        this.restoreScrollPosition();

        return numberOfRows;
    }

    /******************************************************************************/
    /*!
        @brief  Generates the table header.
    */
    /******************************************************************************/
    #generateHeader() {
        /* First row (header block) */
        const tableTitleRowElem = document.createElement("tr");
        const tableHeaderContainerElem = document.createElement("td");
        tableHeaderContainerElem.className = "scrollable-td";

        const tableHeaderElem = document.createElement("table");
        tableHeaderElem.className = "scrollable-table-header";

        const headerElem = document.createElement("tHead");

        /* Header title row */
        const titleRowElem = this.#generateTitleRow();
        if (this.headerIcons != undefined) {
            titleRowElem.appendChild(this.#generateHeaderIcons());
        }
        headerElem.appendChild(titleRowElem);

        /* Second header row (dynamic columns) */
        const headerRowElem = this.#generateColumnTitleHeader();
        headerElem.appendChild(headerRowElem);

        tableHeaderElem.appendChild(headerElem);
        tableHeaderContainerElem.appendChild(tableHeaderElem);
        tableTitleRowElem.appendChild(tableHeaderContainerElem);
        this.containerElem.appendChild(tableTitleRowElem);

        /* Third row (scrollable body table) */
        const tableDataHeaderElem = document.createElement("tr");
        const tableDataHeaderContainerElem = document.createElement("td");
        tableDataHeaderContainerElem.className = "scrollable-td";

        const bodyContainerElem = document.createElement("div");
        bodyContainerElem.id = this.scrollBodyId;
        bodyContainerElem.className = "scrollable-table-container";
        bodyContainerElem.style.height = "unset";
        bodyContainerElem.style.maxHeight = this.maxHeight;

        const bodyTableElem = document.createElement("table");
        bodyTableElem.id = this.id;
        bodyTableElem.className = "scrollable-table";

        bodyContainerElem.appendChild(bodyTableElem);
        tableDataHeaderContainerElem.appendChild(bodyContainerElem);
        tableDataHeaderElem.appendChild(tableDataHeaderContainerElem);
        this.containerElem.appendChild(tableDataHeaderElem);
    }

    /******************************************************************************/
    /*!
        @brief  Generates the title row DOM element.
        @return                     DOM element of the title row
    */
    /******************************************************************************/
    #generateTitleRow() {
        const titleRowElem = document.createElement("tr");
        const tableTitleElem = document.createElement("th");
        tableTitleElem.id = this.titleId;
        tableTitleElem.textContent = this.title;
        tableTitleElem.colSpan = this.columns.length;
        if (this.headerIcons != undefined) {
            tableTitleElem.colSpan -= 1;
        }

        titleRowElem.appendChild(tableTitleElem);

        return titleRowElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates the header icons container DOM element.
        @return                     DOM element of the icons container
    */
    /******************************************************************************/
    #generateHeaderIcons() {
        const headerIconContainerElem = document.createElement("th");
        headerIconContainerElem.style.textAlign = "right";

        let index = 0;
        for (let icon of this.headerIcons) {
            const iconElem = document.createElement("i");
            iconElem.id = icon.id ?? "";
            iconElem.className = icon.icon;
            iconElem.title = icon.title ?? "";

            if (icon.onclickFunction != undefined) {
                iconElem.onclick = icon.onclickFunction;
                iconElem.classList.add("clickable");
            }

            if (index > 0) {
                iconElem.style.marginLeft = "5px";
            }

            index++;
            headerIconContainerElem.appendChild(iconElem);
        }

        return headerIconContainerElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates the column title row DOM element.
        @return                     DOM element of the column title row
    */
    /******************************************************************************/
    #generateColumnTitleHeader() {
        const headerRowElem = document.createElement("tr");
        headerRowElem.style.backgroundColor = "var(--background5)";
        headerRowElem.id = this.headerId;

        /* Generate header cells */
        let index = 0;
        let increaseColSpan = 0;
        for (let column of this.columns) {
            if (!column.visible) {
                index++;
                increaseColSpan++;
                continue;
            }

            const thElem = document.createElement("th");
            thElem.style.width = column.width;

            /* Increase the colspan when some columns are invisible */
            if (increaseColSpan > 0) {
                thElem.colSpan = increaseColSpan + 1;
                increaseColSpan = 0;
            }
            
            if (column.vertical) {
                thElem.style.writingMode = "vertical-lr";
            }

            const cellElem = document.createElement("div");
            cellElem.className = "cell-flex";

            if (column.icon != undefined) {
                /* Add description text */
                const textElem = document.createElement("span");
                textElem.textContent = column.title;
                cellElem.appendChild(textElem);

                /* Add icon */
                const iconElem = document.createElement("i");
                iconElem.title = column.icon.title ?? "";
                iconElem.className = column.icon.icon;
                iconElem.onclick = column.icon.onclickFunction;

                cellElem.appendChild(iconElem);
                thElem.appendChild(cellElem);
            } else if (column.filterOptions != undefined) {
                cellElem.style.gap = "5px";
                cellElem.style.justifyContent = "unset";

                /* Add description text */
                const textElem = document.createElement("span");
                textElem.textContent = column.title;
                cellElem.appendChild(textElem);

                /* Add icon */
                const iconElem = document.createElement("i");
                iconElem.className = "fa-duotone fa-solid fa-filter clickable filter-icon";
                iconElem.id = this.id + "FilterIcon" + index;
                iconElem.title = TEXT_SELECT_FILTERS;
                iconElem.onclick = this.showMenu.bind(this, index);

                cellElem.appendChild(iconElem);
                thElem.appendChild(cellElem);

                this.#generateColumnFilterMenu(column, index);
            } else if (column.canBeSorted) {
                cellElem.style.gap = "5px";
                cellElem.style.justifyContent = "unset";

                /* Add description text */
                const textElem = document.createElement("span");
                textElem.textContent = column.title;
                cellElem.appendChild(textElem);

                /* Add icon */
                const iconElem = document.createElement("i");
                iconElem.id = this.id + "SortingIcon" + index;
                iconElem.className = "fa-duotone fa-solid fa-arrow-down-arrow-up clickable filter-icon";
                iconElem.title = TEXT_CLICK_TO_SORT;
                iconElem.onclick = this.toggleColumnSorting.bind(this, index);

                cellElem.appendChild(iconElem);
                thElem.appendChild(cellElem);
            } else {
                thElem.textContent = column.title;
            }

            headerRowElem.appendChild(thElem);
            index++;
        }

        /* Add filter menu events */
        window.addEventListener("click", (e) => {
            const isClickInsideMenu = e.target.closest(".table-filter-container");
            const isClickOnIcon = e.target.closest(".filter-icon");

            if (isClickInsideMenu || isClickOnIcon) return;

            this.filterMenus.forEach(menu => {
                if (menu.open) {
                    this.hideMenu(menu);
                }
            });
        });

        /* Hide filter menu on scroll events */
        window.addEventListener("scroll", () => {
            this.filterMenus.forEach(menu => {
                if (menu.open) {
                    this.hideMenu(menu);
                }
            });
        });
        
        return headerRowElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates a column filter menu DOM element.
        @param  column              Object with column data
        @param  index               Index of the column
    */
    /******************************************************************************/
    #generateColumnFilterMenu(column, index) {
        const menuContainerElem = document.createElement("div");
        menuContainerElem.className = "table-filter-container";
        menuContainerElem.id = this.id + "TableFilterContainer" + index;

        for (let option of column.filterOptions) {
            if (option.selected == undefined) {
                option.selected = false;
            }

            const menuItemContainerElem = document.createElement("div");
            menuItemContainerElem.className = "table-filter-item-container";

            const filterCbElem = document.createElement("input");
            filterCbElem.type = "checkbox";
            filterCbElem.onclick = () => this.toggleColumnFilter(index, option.value);
            filterCbElem.checked = option.selected;
            menuItemContainerElem.appendChild(filterCbElem);

            if (option.icon != undefined) {
                const iconElem = document.createElement("i");
                iconElem.className = option.icon;
                menuItemContainerElem.appendChild(iconElem);
            }

            const filterNameElem = document.createElement("p");
            filterNameElem.textContent = option.text;
            menuItemContainerElem.appendChild(filterNameElem);

            menuContainerElem.appendChild(menuItemContainerElem);
        }

        this.filterMenus.push({
            index: index,
            id: menuContainerElem.id,
            open: false
        });

        document.body.appendChild(menuContainerElem);
    }

    /******************************************************************************/
    /*!
        @brief  Generates a checkbox cell DOM element.
        @param  cell                Object containing cell data
        @return                     DOM element of the checkbox
    */
    /******************************************************************************/
    #generateCheckboxCell(cell) {
        const checkboxElem = document.createElement("input");
        checkboxElem.type = "checkbox";
        checkboxElem.id = cell.id ?? "";
        checkboxElem.onclick = cell.onclickFunction ?? null;
        checkboxElem.checked = cell.checked;
        checkboxElem.title = cell.title ?? "";

        if (cell.disabled) {
            checkboxElem.className = "disabled-checkbox";
            checkboxElem.disabled = true;
            checkboxElem.style.cursor = "not-allowed";
        }
        
        return checkboxElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates a radio button cell DOM element.
        @param  cell                Object containing cell data
        @return                     DOM element of the radio button
    */
    /******************************************************************************/
    #generateRadioButtonCell(cell) {
        const radioButtonElem = document.createElement("input");
        radioButtonElem.type = "radio";
        radioButtonElem.onclick = cell.onclickFunction ?? null;
        radioButtonElem.checked = cell.checked;
        radioButtonElem.title = cell.title ?? "";
        radioButtonElem.id = cell.id ?? "";
        radioButtonElem.name = cell.name;

        if (cell.disabled) {
            radioButtonElem.className = "disabled-checkbox";
            radioButtonElem.disabled = true;
            radioButtonElem.style.cursor = "not-allowed";
        }
        
        return radioButtonElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates an input cell DOM element.
        @param  cell                Object containing cell data
        @return                     DOM element of the input
    */
    /******************************************************************************/
    #generateInputCell(cell) {
        const inputElem = document.createElement("input");
        inputElem.type = cell.inputType;
        inputElem.value = cell.value;
        inputElem.id = cell.id ?? "";
        inputElem.min = cell.minimumValue ?? "";
        inputElem.max = cell.maximumValue ?? "";
        inputElem.onchange = cell.onchangeFunction ?? null;
        inputElem.className = "table-input";
        inputElem.style.cursor = "text";
        if (cell.invalid) {
            inputElem.className = "table-input invalid-input";
        }
        
        return inputElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates an icon cell DOM element.
        @param  cell                Object containing cell data
        @return                     DOM element of the icon
    */
    /******************************************************************************/
    #generateIconCell(cell) {
        const iconElem = document.createElement("i");
        iconElem.id = cell.id ?? "";
        iconElem.className = cell.icon.icon;
        iconElem.style.color = cell.icon.color ?? iconElem.style.color;
        iconElem.title = cell.icon.title ?? iconElem.title;

        iconElem.onclick = cell.icon.onclickFunction ?? null;
        if (iconElem.onclick != null) {
            iconElem.classList.add("clickable");
        }
        
        return iconElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates an image cell DOM element.
        @param  cell                Object containing cell data
        @return                     DOM element of the image
    */
    /******************************************************************************/
    #generateImageCell(cell) {
        const tileElem = document.createElement("div");
        tileElem.className = "image-wrapper";
        
        /* Image element */
        const imageElem = document.createElement("img");
        imageElem.id = cell.id ?? "";
        imageElem.className = "sub-image cell-image";
        imageElem.src = cell.src;
        tileElem.appendChild(imageElem);

        /* Overlay */
        const overlayElem = document.createElement("div");
        overlayElem.className = "image-overlay";

        /* Preview icon */
        const iconElem = document.createElement("i");
        iconElem.className = "fa-solid fa-magnifying-glass-plus fa-lg clickable";
        iconElem.style.marginLeft = "10px";
        iconElem.onclick = () => showImagePreviewBySource(cell.src);

        overlayElem.appendChild(iconElem);
        tileElem.appendChild(overlayElem);
        
        return tileElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates a text cell with inline options DOM element.
        @param  cell                Object containing cell data
        @return                     DOM element of the cell
    */
    /******************************************************************************/
    #generateTextIconsCell(cell) {
        /* Create a flex container for text + icon */
        const containerElem = document.createElement("div");
        containerElem.className = "cell-flex";

        /* Add text */
        const textElem = document.createElement("span");
        textElem.textContent = cell.textLabel ?? cell.value ?? "";
        textElem.id = cell.id ?? "";

        let iconsLocation = cell.iconsLocation ?? "after";
        let textAppended = false;

        if (iconsLocation == "after") {
            containerElem.appendChild(textElem);
            textAppended = true;
        }

        if (cell.icons == undefined || cell.icons.length == 0) {
            if (!textAppended) {
                containerElem.appendChild(textElem);
            }
            return containerElem;
        }

        /* Create option icons */
        const iconContainerElem = document.createElement("div");
        iconContainerElem.className = "cell-flex";

        for (let icon of cell.icons) {
            const iconElem = document.createElement("i");
            iconElem.className = icon.icon;
            iconElem.style.color = icon.color ?? iconElem.style.color;
            iconElem.title = icon.title ?? "";
            iconElem.onclick = icon.onclickFunction ?? null;
            if (iconElem.onclick != null) {
                iconElem.classList.add("clickable");
            }
            iconElem.id = icon.id ?? "";
            iconContainerElem.appendChild(iconElem);
        }

        containerElem.appendChild(iconContainerElem);

        if (iconsLocation == "before") {
            containerElem.appendChild(textElem);
            containerElem.style.justifyContent = "flex-start";
        }

        return containerElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates a select input cell DOM element.
        @param  cell                Object containing cell data
        @return                     DOM element of the cell
    */
    /******************************************************************************/
    #generateSelectInputCell(cell) {
        const inputElem = document.createElement("select");
        inputElem.id = cell.id ?? "";
        inputElem.onchange = cell.onchangeFunction ?? null;
        inputElem.className = "table-input";

        //input.style.cursor = "text";
        if (cell.invalid) {
            inputElem.className = "table-input invalid-input";
        }
        
        let option;

        for (let selectOption of cell.selectOptions) {
            option = document.createElement("option");
            option.value = selectOption.value;
            option.textContent = selectOption.text;
            inputElem.appendChild(option);
        }

        inputElem.value = cell.value;

        return inputElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates a text cell with inline input that can be toggled DOM
                element.
        @param  cell                Object containing cell data
        @param  cellIndex           Index of the cell, for DOM ID generation
        @return                     DOM element of the cell
    */
    /******************************************************************************/
    #generateToggleableInputCell(cell, cellIndex) {
        /* Create a flex container for text + icon */
        const containerElem = document.createElement("div");
        containerElem.className = "cell-flex";
        containerElem.id = this.inputIdPrefix + cellIndex + "Container";

        /* Add description text */
        const textElem = document.createElement("span");
        textElem.textContent = cell.value;
        textElem.id = this.inputIdPrefix + cellIndex + "Field";
        containerElem.appendChild(textElem);

        /* Add description input */
        if (cell.inputType == "textarea") {
            const inputElem = document.createElement("textarea");
            inputElem.rows = 5;
            inputElem.cols = 20;
            inputElem.className = "table-input description-input";
            inputElem.style.display = "none";
            inputElem.value = cell.value
            inputElem.id = this.inputIdPrefix + cellIndex + "Input";

            if (cell.itemIdKey != undefined) {
                inputElem.setAttribute(cell.itemIdKey, cell.itemIdValue);
            }

            containerElem.appendChild(inputElem);
        }

        /* Create edit icon */
        const iconContainerElem = document.createElement("div");
        iconContainerElem.className = "cell-flex";

        cell.options = cell.options ?? [];
        cell.options.push({
            id: this.inputIdPrefix + "cell" + cellIndex + "EditIcon",
            icon: "fa-duotone fa-solid fa-pen-to-square fa-lg clickable",
            title: TEXT_EDIT,
            onclickFunction: () => this.#toggleInputCell(cellIndex),
            saveFunction: cell.saveFunction
        })

        for (let option of cell.options) {
            const iconElem = document.createElement("i");
            iconElem.className = option.icon;
            iconElem.title = option.title;
            iconElem.onclick = option.onclickFunction;
            if (option.saveFunction != undefined) {
                this.togglableInputSaveFunctions.push(option.saveFunction);
                iconElem.dataset.saveFunctionIndex = this.togglableInputSaveFunctions.length-1;
            }
            iconElem.id = option.id ?? "";
            iconContainerElem.appendChild(iconElem);
        }

        containerElem.appendChild(iconContainerElem);
        return containerElem;
    }

    /******************************************************************************/
    /*!
        @brief  Generates a cell with row options DOM element.
        @param  tableOptions        Array of options to include
        @return                     DOM element of the cell
    */
    /******************************************************************************/
    #generateTableOptionsCell(tableOptions) {
        const iconContainerElem = document.createElement("div");
        iconContainerElem.style.display = "flex";
        iconContainerElem.style.gap = "5px";
        iconContainerElem.style.alignItems = "center";

        /* Nowrap only recommended for desktop-only UIs to optimize table line up */
        iconContainerElem.style.flexWrap = "nowrap";

        for (let option of tableOptions) {
            const iconElem = document.createElement("i");
            iconElem.id = option.id ?? "";
            iconElem.className = option.icon;
            if (option.onclickFunction != undefined) {
                iconElem.onclick = option.onclickFunction;
                iconElem.classList.add("clickable");
            }

            option.disabled = option.disabled ?? false;
            if (option.disabled) {
                iconElem.disabled = true;
                iconElem.classList.add("disabled-icon");
                iconElem.onclick = null;
            }
            iconElem.title = option.title;
            iconContainerElem.appendChild(iconElem);
        }

        return iconContainerElem;
    }

    /******************************************************************************/
    /*!
        @brief  Resets the specified input cell DOM element.
        @param  cellIndex           Index of the cell
    */
    /******************************************************************************/
    #resetInputCell(cellIndex) {
        const fieldElem = document.getElementById(this.inputIdPrefix + cellIndex + "Field");
        const inputElem = document.getElementById(this.inputIdPrefix + cellIndex + "Input");
        inputElem.value = fieldElem.textContent;                                    //Reset input value

        this.#toggleInputCell(cellIndex);
    }

    /******************************************************************************/
    /*!
        @brief  Toggles the specified text/input cell DOM element.
        @param  cellIndex           Index of the cell
    */
    /******************************************************************************/
    #toggleInputCell(cellIndex) {
        const containerElem = document.getElementById(this.inputIdPrefix + cellIndex + "Container");
        const fieldElem = document.getElementById(this.inputIdPrefix + cellIndex + "Field");
        const inputElem = document.getElementById(this.inputIdPrefix + cellIndex + "Input");
        const saveIconElem = document.getElementById(this.inputIdPrefix + "cell" + cellIndex + "EditIcon");

        /* Start to update */
        if (saveIconElem.className == "fa-duotone fa-solid fa-pen-to-square fa-lg clickable") {
            saveIconElem.className = "fa-duotone fa-solid fa-floppy-disk fa-lg clickable";
            saveIconElem.title = TEXT_SAVE;
            
            saveIconElem.onclick = () => this.togglableInputSaveFunctions[saveIconElem.dataset.saveFunctionIndex]();

            const cancelIconElem = document.createElement("i");
            cancelIconElem.id = this.inputIdPrefix + "cell" + cellIndex + "CancelIcon";
            cancelIconElem.className = "fa-duotone fa-solid fa-floppy-disk-circle-xmark fa-lg clickable";
            cancelIconElem.title = TEXT_CANCEL;
            cancelIconElem.onclick = () => this.#resetInputCell(cellIndex);
            containerElem.appendChild(cancelIconElem);

            fieldElem.style.display = "none";
            inputElem.style.display = "block";
        } else {
            /* Was updating */
            saveIconElem.className = "fa-duotone fa-solid fa-pen-to-square fa-lg clickable";
            saveIconElem.title = TEXT_SAVE;
            saveIconElem.onclick = () => this.#toggleInputCell(cellIndex);
            
            let cancelIconElem = document.getElementById(this.inputIdPrefix + "cell" + cellIndex + "CancelIcon")
            cancelIconElem.remove();

            fieldElem.style.display = "block";
            inputElem.style.display = "none";
        }
    }
}