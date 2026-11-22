/****************************************************************************/
/*
 * File:    configure_led_addressing_page.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Page controller for configure led addressing.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import {
    TEXT_ADDRESSING_CONFIGURATION_LOADED, TEXT_ASSIGN_ADDRESS, TEXT_CANCEL,
    TEXT_CHANGES_SAVED_SUCCESSFULLY, TEXT_CLEAR, TEXT_ERROR, TEXT_INACTIVE_SEGMENT,
    TEXT_INVALID_ADDRESSING_NO_ADDRESSES, TEXT_LED_SEGMENT, TEXT_MAXIMUM_NUMBER_OF_LEDS_REACHED,
    TEXT_NO_ADDRESSING_CONFIGURATION_START_DRAWING, TEXT_NO_OF_LEDS_CONFIGURED, TEXT_RESET,
    TEXT_RESET_ADDRESSING, TEXT_SAVE, TEXT_START_ADDRESS_TO_LOW, TEXT_SUCCESS, TEXT_WARNING
} from "../domain/language_pack_english.js";
import { MouseContextMenu } from "../../vendor/templates/js/ui_components/index.js";
import { LedCanvas } from "../ui_components/LedCanvas.js";
import { mountPage, readPageData } from "../core/page.js";
import { determineStripCanvasBounds, getSegments } from "../domain/led_geometry.js";
import { saveDrawing } from "../services/led_editor.js";

const { http, signal, banners, components } = mountPage("configuration");
let { strip } = readPageData();

const SEGMENT_TYPE_LED = 1;
const SEGMENT_TYPE_INACTIVE = 0;
const ASCENDING = 0;
const MAX_NUMBER_OF_LEDS = 250;

//#region Elements
const instructionMessageFieldElem = document.getElementById("instructionMessageField");
const drawingElementFieldElem = document.getElementById("drawingElementField");
const clearBtnElem = document.getElementById("clearBtn");
const resetBtnElem = document.getElementById("resetBtn");
const resetAddressingBtnElem = document.getElementById("resetAddressingBtn");
const saveBtnElem = document.getElementById("saveBtn");
const cancelBtnElem = document.getElementById("cancelBtn");
const drawingElementIconElem = document.getElementById("drawingElementIcon");
const addressTxtElem = document.getElementById("addressTxt");
const toolbarContainerElem = document.getElementById("toolbarContainer");
const canvasElem = document.getElementById("ledCanvas");
const ledCanvas = new LedCanvas(canvasElem).mount();

components.push(ledCanvas);
//#endregion

//#region Constants
const LED_SPACING = 10;
const LED_RADIUS = 5;
const POINT_RADIUS = LED_RADIUS + 5;
const SNAP_POINT = 10;
const CANVAS_WIDTH = 800; //TODO set canvas width
//#endregion

//#region Variables
let currentStrip; //For storing a backup of the current configuration
let selectedSegmentIndex = null; //Selected segment for dragging
let selectedPointIndex = null; //Selected point for dragging
let selectedLedIndex = -1;
let isDragging = false;
let hasDragged = false;
let isDrawing = false;
let numberOfPointsBeforeDrawing = 0;
let points = [];
let dragLastPos = null;
let drawSegmentType = SEGMENT_TYPE_LED;
let addressingOrder = ASCENDING;

const menuRoot = document.querySelector('[data-ref="led-menu"]');
const ledMenu = new MouseContextMenu(menuRoot, {
    items: [{ label: TEXT_ASSIGN_ADDRESS, icon: "fa-solid fa-list-ol", action: "assign" }]
}).mount();

components.push(ledMenu);

menuRoot.addEventListener("ui:action", () => toggleSegmentType(), { signal });

//#endregion
//#region Event listeners
/*ledAddressTxtElem.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
        strip.leds[selectedLedIndex].address = ledAddressTxtElem.value;
        toggleLedMouseContextMenu(false);
        render();
    }
});
addressTxtElem.addEventListener("keydown", function (e) {
    if (e.code === "Enter") {
        if (addressingOrder == ASCENDING) {
            ascendAddressing();
        } else if (addressingOrder == DESCENDING) {
            descendAddressing();
        }
    }
});*/
/****************************************************************************/
/*!
 * @brief   When page finished loading, this function is executed.
 */
/****************************************************************************/
document.querySelector('[data-action="toggleSegmentType"]').addEventListener("click", () =>
    toggleSegmentType(undefined, true), { signal });
document.querySelector('[data-action="resetAll"]').addEventListener("click", () =>
    resetAll(), { signal });
document.querySelector('[data-action="loadCurrent"]').addEventListener("click", () =>
    loadCurrent(), { signal });
document.querySelector('[data-action="resetAddressing"]').addEventListener("click", () =>
    resetAddressing(), { signal });
document.querySelector('[data-action="save"]').addEventListener("click", () => save(), { signal });
initialize();

/****************************************************************************/
/*!
 * @brief   Loads page text, initial state and page-specific controls.
 */
/****************************************************************************/
function initialize() {
    loadText();
    toolbarContainerElem.style.width = CANVAS_WIDTH + "px";

    currentStrip = structuredClone(strip);

    if (strip.segments.length == 0) {
        printInstructionMessage(TEXT_NO_ADDRESSING_CONFIGURATION_START_DRAWING, "warning");
        isDrawing = true;
        numberOfPointsBeforeDrawing = 0;                                    //No LEDs, so no points yet
    } else {
        printInstructionMessage(TEXT_ADDRESSING_CONFIGURATION_LOADED, "success");
        loadLedAddressing();
    }

    toggleSegmentType(SEGMENT_TYPE_LED);
}

//#region Configuration functions
/****************************************************************************/
/*!
 * @brief   Resets the whole configuration.
 */
/****************************************************************************/
function resetAll() {
    points = [];
    selectedSegmentIndex = null;
    render();
}

/****************************************************************************/
/*!
 * @brief   Loads the current saved configuration.
 */
/****************************************************************************/
function loadCurrent() {
    points = [];
    selectedSegmentIndex = null;
    strip = structuredClone(currentStrip);
    loadLedAddressing();
}

/****************************************************************************/
/*!
 * @brief   Resets the addresses of all the LEDs.
 */
/****************************************************************************/
function resetAddressing() {
    for (let led of strip.leds) {
        if (led.segment_index != parseInt(selectedSegmentIndex)) {
            continue;
        }

        led.address = 0;
    }

    render();
}

/****************************************************************************/
/*!
 * @brief   Toggles the segment type.
 * @param   type                    Type to set
 * @param   drawingSegmentType      If true, the segment type for drawing is toggled
 */
/****************************************************************************/
function toggleSegmentType(type = undefined, drawingSegmentType = false) {
    if (type == undefined) {
        //toggleSegmentMouseContextMenu(false);
        if (drawingSegmentType) {
            drawSegmentType = !drawSegmentType;
            if (points.length > 0) {
                points[points.length - 1].type = drawSegmentType;
            }
        } else {
            if (selectedSegmentIndex != null) {
                if (points[selectedSegmentIndex].type == SEGMENT_TYPE_LED) {
                    points[selectedSegmentIndex].type = SEGMENT_TYPE_INACTIVE;
                } else {
                    points[selectedSegmentIndex].type = SEGMENT_TYPE_LED;
                }
            }
        }
    } else {
        if (drawingSegmentType) {
            drawSegmentType = type;
            points[points.length - 1].type = drawSegmentType;
        }
    }

    //if (drawingSegmentType) {
    if (drawSegmentType) {
        drawingElementFieldElem.textContent = TEXT_LED_SEGMENT;
        drawingElementIconElem.className = "fa-duotone fa-solid fa-lightbulb fa-lg";
    } else {
        drawingElementFieldElem.textContent = TEXT_INACTIVE_SEGMENT;
        drawingElementIconElem.className = "fa-duotone fa-solid fa-horizontal-rule fa-lg";
    }
    //}
    strip.segments = getSegments(points);
    render();
}

/****************************************************************************/
/*!
 * @brief   Saves the LED addressing by sending it to the back-end.
 */
/****************************************************************************/
async function save() {
    if (!validateLedstripLedAddressing()) {
        return;
    }

    centerStrip();

    let data = {
        id: strip.id,
        leds: strip.leds.map(({ x, y, ...led }) => led),
        segments: getSegments(points)
    };

    try {
        await saveDrawing(http, "/update_ledstrip_leds", data, signal);
    } catch (error) {
        if (!signal.aborted) banners.show({
            title: TEXT_ERROR,
            message: error.message,
            type: "error"
        });

        return;
    }

    banners.show({
        title: TEXT_SUCCESS,
        message: TEXT_CHANGES_SAVED_SUCCESSFULLY,
        type: "success"
    });
    currentStrip = structuredClone(strip);
}

/****************************************************************************/
/*!
 * @brief   Gives the selected segment LEDs an ascending addresses.
 */
/****************************************************************************/
function ascendAddressing() {
    let startAddress = parseInt(addressTxtElem.value);

    for (let led of strip.leds) {
        if (led.segment_index != parseInt(selectedSegmentIndex)) {
            continue;
        }

        led.address = startAddress;
        startAddress++;
    }

    addressTxtElem.value = startAddress;

    render();
}

/****************************************************************************/
/*!
 * @brief   Gives the selected segment LEDs a descending addresses.
 */
/****************************************************************************/
function descendAddressing() {
    let startAddress = addressTxtElem.value;
    let numberOfLedsInSegment = getNumberOfLedsInSegment(selectedSegmentIndex);
    if (startAddress + 1 - numberOfLedsInSegment < 0) {
        banners.show({ title: TEXT_ERROR, message: TEXT_START_ADDRESS_TO_LOW, type: "error" });

        return;
    }

    for (let led of strip.leds) {
        if (led.segment_index != parseInt(selectedSegmentIndex)) {
            continue;
        }

        led.address = startAddress;
        startAddress--;
    }

    addressTxtElem.value = startAddress;

    render();
}

//#endregion
//#region Mouse event functions
//#region Event listeners
/* Undo button */
/****************************************************************************/
/*!
 * @brief   Removes the last drawn point when the undo shortcut is pressed.
 * @param   e                       Event reported by the bound control.
 */
/****************************************************************************/
document.addEventListener("keydown", function (e) {
    if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        points.pop();
        render();
    }
}, { signal });

/****************************************************************************/
/*!
 * @brief   Suppresses the native canvas context menu.
 * @param   e                       Event reported by the bound control.
 */
/****************************************************************************/
canvasElem.addEventListener("contextmenu", e => {
    e.preventDefault();
}, { signal });

/* Mouse button released */
/****************************************************************************/
/*!
 * @brief   Starts the canvas action for the pressed mouse button.
 * @param   e                       Event reported by the bound control.
 */
/****************************************************************************/
canvasElem.addEventListener("mousedown", e => {
    let position = ledCanvas.position(e);

    if (e.button === 0) {
        e.preventDefault();
        leftMouseDown(position);
    } else if (e.button == 2) {
        rightMouseDown(position);
    }
}, { signal });

/* Dragging segment or point on mousemove (only when right button dragging) */
/****************************************************************************/
/*!
 * @brief   Updates a dragged point or the segment being drawn.
 * @param   e                       Event reported by the bound control.
 */
/****************************************************************************/
canvasElem.addEventListener("mousemove", e => {
    let position = ledCanvas.position(e);

    if (isDragging) {
        calculateDragPosition(position);

        return;
    }

    if (isDrawing) {
        drawNewSegment(position);
    }
}, { signal });

/* Mouse button released */
/****************************************************************************/
/*!
 * @brief   Finishes the canvas action for the released mouse button.
 * @param   e                       Event reported by the bound control.
 */
/****************************************************************************/
canvasElem.addEventListener("mouseup", e => {
    let position = ledCanvas.position(e);

    if (e.button === 0) {
        leftMouseUp(position);
    } else if (e.button == 2) {
        rightMouseUp(position);
    }
}, { signal });
//#endregion

/****************************************************************************/
/*!
 * @brief   Executed when left mouse button is pressed.
 * @param   position                Mouse position (X, Y)
 */
/****************************************************************************/
function leftMouseDown(position) {
    /* If is drawing, don't select a led */
    if (isDrawing) {
        return;
    }

    // Check LED click first
    selectedLedIndex = findLedAtPosition(position.x, position.y);
    if (selectedLedIndex !== -1) {
        render();

        return;
    }

    /* Not clicked on LED, add segment */
    isDrawing = true;
    numberOfPointsBeforeDrawing = points.length;
}

/****************************************************************************/
/*!
 * @brief   Executed when right mouse button is pressed.
 * @param   position                Mouse position (X, Y)
 */
/****************************************************************************/
function rightMouseDown(position) {
    isDragging = false;
    hasDragged = false;
    selectedPointIndex = null;
    selectedSegmentIndex = null;

    let pointIndex = findPointAtPos(position.x, position.y);
    if (pointIndex !== -1) {
        selectedPointIndex = pointIndex;
        isDragging = true;
        dragLastPos = position;
        render();

        return;
    }

    let segmentIndex = findSegmentAtPosition(position.x, position.y);
    if (segmentIndex !== -1) {
        selectedSegmentIndex = segmentIndex;
        isDragging = true;
        dragLastPos = position;
    }

    render();
}

/****************************************************************************/
/*!
 * @brief   Executed when left mouse button is lifted.
 * @param   position                Mouse position (X, Y)
 */
/****************************************************************************/
function leftMouseUp(position) {
    ledMenu.hide();

    if (isDrawing) {
        isDrawing = false;

        return;
    }

    if (selectedLedIndex !== -1) {
        const rect = canvasElem.getBoundingClientRect();
        ledMenu.show(rect.left + position.x, rect.top + position.y);
        addressTxtElem.value = strip.leds[selectedLedIndex].address;
    }
}

/****************************************************************************/
/*!
 * @brief   Executed when right mouse button is lifted.
 * @param   position                Mouse position (X, Y)
 */
/****************************************************************************/
function rightMouseUp(position) {
    ledMenu.hide();

    if (!isDragging) {
        return;
    }

    isDragging = false;

    if (hasDragged || selectedSegmentIndex === null) {
        selectedSegmentIndex = null;
        selectedPointIndex = null;
    }

    render();
}

/****************************************************************************/
/*!
 * @brief   Drags the selected segment to the specified location.
 * @param   dx                      Delta X
 * @param   dy                      Delta Y
 */
/****************************************************************************/
function dragSegment(dx, dy) {
    if (selectedSegmentIndex === null) {
        return;
    }

    let p1 = points[selectedSegmentIndex];
    let p2 = points[selectedSegmentIndex + 1];

    let newP1 = { x: p1.x + dx, y: p1.y + dy };
    let newP2 = { x: p2.x + dx, y: p2.y + dy };

    // Constrain to horizontal or vertical
    if (Math.abs(newP2.x - newP1.x) > Math.abs(newP2.y - newP1.y)) {
        newP2.y = newP1.y;
    } else {
        newP2.x = newP1.x;
    }

    points[selectedSegmentIndex].x = newP1.x;
    points[selectedSegmentIndex].y = newP1.y;
    points[selectedSegmentIndex + 1].x = newP2.x;
    points[selectedSegmentIndex + 1].y = newP2.y;

    render();
}

/****************************************************************************/
/*!
 * @brief   Drags the selected point to the specified location.
 * @param   dx                      Delta X
 * @param   dy                      Delta Y
 */
/****************************************************************************/
function dragPoint(dx, dy) {
    if (selectedPointIndex === null) {
        return;
    }

    let p1 = points[selectedPointIndex];

    let newP1 = { x: p1.x + dx, y: p1.y + dy };

    points[selectedPointIndex] = newP1;

    render();
}

/****************************************************************************/
/*!
 * @brief   Calculates whether a new segment has to be drawn and adds a new
 *          segment if needed.
 * @param   position                X, Y position
 */
/****************************************************************************/
function drawNewSegment(position) {
    position.x = Math.round(position.x / SNAP_POINT) * SNAP_POINT;
    position.y = Math.round(position.y / SNAP_POINT) * SNAP_POINT;

    if (points.length > numberOfPointsBeforeDrawing) {
        points.pop();
    }

    if (points.length === 0) {
        let point = position;
        point.type = drawSegmentType;
        point.index = points.length;
        point.segment = strip.segments.length;

        points.push(point);
        strip.segments = getSegments(points);
    } else {
        let point = snapToAngle(points[points.length - 1], position, 11.25);
        point.type = drawSegmentType;
        point.index = points.length;
        point.segment = strip.segments.length;

        if (point.x != -1) {
            points.push(point);
            strip.segments = getSegments(points);
        }
    }

    render();
}

/****************************************************************************/
/*!
 * @brief   Calculates whether the segment is dragged and drags the segment if
 *          needed.
 * @param   position                X, Y position
 */
/****************************************************************************/
function calculateDragPosition(position) {
    let dx = position.x - dragLastPos.x;
    let dy = position.y - dragLastPos.y;

    position.x = Math.round(position.x / SNAP_POINT) * SNAP_POINT;
    position.y = Math.round(position.y / SNAP_POINT) * SNAP_POINT;

    if (Math.abs(dx) > SNAP_POINT || Math.abs(dy) > SNAP_POINT) {
        hasDragged = true;
        if (selectedPointIndex !== null) {
            points[selectedPointIndex].x = position.x;
            points[selectedPointIndex].y = position.y;
            dragLastPos = position;
        } else if (selectedSegmentIndex !== null) {
            dragSegment(dx, dy);
            dragLastPos = position;
        }
    }

    render();
}

/****************************************************************************/
/*!
 * @brief   Displays an LED addressing instruction with its message style.
 * @param   message                 Message shown to the user.
 * @param   messageType             Visual status of the instruction.
 */
/****************************************************************************/
function printInstructionMessage(message, messageType = undefined) {
    instructionMessageFieldElem.textContent = message;

    if (messageType) {
        instructionMessageFieldElem.className = "message " + messageType;
    }
}

//#endregion
//#region Canvas functions
/****************************************************************************/
/*!
 * @brief   Calculates the LEDs for the canvas based on the configured points.
 * @returns array                   Array with LED objects
 */
/****************************************************************************/
function calculateLeds() {
    let leds = [];

    for (let i = 1; i < points.length; i++) {
        let dx = points[i].x - points[i - 1].x;
        let dy = points[i].y - points[i - 1].y;
        let length = Math.sqrt(dx * dx + dy * dy);
        let numberOfLedsInSegment = Math.floor(length / LED_SPACING);
        let nx = dx / length;
        let ny = dy / length;

        if (strip.segments[i - 1].type == SEGMENT_TYPE_INACTIVE) {
            continue;
        }

        for (let j = 0; j <= numberOfLedsInSegment; j++) {
            let x = Math.floor(parseFloat(points[i - 1].x) + nx * LED_SPACING * j);
            let y = parseFloat(points[i - 1].y) + ny * LED_SPACING * j;

            if (leds.length > 0 && leds[leds.length - 1].x == x && leds[leds.length - 1].y == y) {
                continue;
            }

            leds.push({ x, y, index: leds.length, address: 0, segment_index: i - 1 });

            if (leds.length - 1 < strip.leds.length) {
                leds[leds.length - 1].address = parseInt(strip.leds[leds.length - 1].address);
            }
        }
    }

    return leds;
}

/****************************************************************************/
/*!
 * @brief   Renders the configuration on the canvas.
 */
/****************************************************************************/
function render() {
    if (points.length >= 2) strip.leds = calculateLeds();
    ledCanvas.update({
        points,
        leds: strip.leds,
        segments: strip.segments,
        addressing: true,
        drawing: isDrawing,
        selectedSegment: selectedSegmentIndex,
        selectedPoint: selectedPointIndex,
        selectedLed: selectedLedIndex
    });
}

/****************************************************************************/
/*!
 * @brief   Snaps the two specified points to the specified angle step.
 * @param   p1                      Point 1
 * @param   p2                      Point 2
 * @param   stepDeg                 Snap step in degrees (e.g. 90, 45, 11.25)
 * @returns object                  Snapped X and Y
 */
/****************************************************************************/
function snapToAngle(p1, p2, stepDeg) {
    let dx = p2.x - p1.x;
    let dy = p2.y - p1.y;

    // Calculate raw angle in radians
    let angle = Math.atan2(dy, dx);

    // Convert to degrees for snapping
    let angleDeg = angle * (180 / Math.PI);

    // Snap to nearest multiple of stepDeg
    let snappedAngleDeg = Math.round(angleDeg / stepDeg) * stepDeg;

    // Convert snapped angle back to radians
    let snappedAngle = snappedAngleDeg * (Math.PI / 180);

    // Preserve original distance between points
    let distance = Math.sqrt(dx * dx + dy * dy);

    // Compute new endpoint
    let x = p1.x + distance * Math.cos(snappedAngle);
    let y = p1.y + distance * Math.sin(snappedAngle);

    return { x: x, y: y };
}

/****************************************************************************/
/*!
 * @brief   Returns the LED at the specified position. Or -1 when no LED is on
 * that location.
 * @param   x                       X position
 * @param   y                       Y position
 * @returns integer                 LED index
 */
/****************************************************************************/
function findLedAtPosition(x, y) {
    strip.leds = calculateLeds();

    for (let led of strip.leds) {
        let distance = Math.hypot(led.x - x, led.y - y);
        if (distance <= POINT_RADIUS) {
            return led.index;
        }
    }

    return -1;
}

/****************************************************************************/
/*!
 * @brief   Returns the segment at the specified position. Or -1 when no segment
 * is on that location.
 * @param   x                       X position
 * @param   y                       Y position
 * @returns integer                 Segment index
 */
/****************************************************************************/
function findSegmentAtPosition(x, y) {
    for (let i = 0; i < points.length - 1; i++) {
        if (pointToSegmentDistance({ x, y }, points[i], points[i + 1]) <= 8) {
            return i;
        }
    }

    return -1;
}

/****************************************************************************/
/*!
 * @brief   Returns the point at the specified position. Or -1 when no point is
 * on that location.
 * @param   x                       X position
 * @param   y                       Y position
 * @returns integer                 Point index
 */
/****************************************************************************/
function findPointAtPos(x, y) {
    let index = 0;
    for (let point of points) {
        let distance = Math.hypot(point.x - x, point.y - y);
        if (distance <= POINT_RADIUS) {
            return index;
        }

        index++;
    }

    return -1;
}

/****************************************************************************/
/*!
 * @brief   Calculates the distance between the specified point and segment.
 * @param   P                       Point
 * @param   A                       Segment endpoint A
 * @param   B                       Segment endpoint B
 * @returns integer                 Distance between the point and segment
 */
/****************************************************************************/
function pointToSegmentDistance(P, A, B) {
    const ABx = B.x - A.x;
    const ABy = B.y - A.y;
    const APx = P.x - A.x;
    const APy = P.y - A.y;
    const AB_len_sq = ABx * ABx + ABy * ABy;
    let t = (APx * ABx + APy * ABy) / AB_len_sq;

    t = Math.max(0, Math.min(1, t));

    const closestX = A.x + ABx * t;
    const closestY = A.y + ABy * t;
    const dx = P.x - closestX;
    const dy = P.y - closestY;

    return Math.sqrt(dx * dx + dy * dy);
}

/****************************************************************************/
/*!
 * @brief   Centers the strip on the canvas.
 */
/****************************************************************************/
function centerStrip() {
    let bound = determineStripCanvasBounds(strip);

    let stripWidth = bound.highestX - bound.lowestX;
    let stripHeight = bound.highestY - bound.lowestY;

    points = [];

    for (let i = 0; i < strip.segments.length; i++) {
        if (i == 0) {
            points.push({
                x: strip.segments[i].x1 - bound.lowestX + (canvasElem.width - stripWidth) / 2,
                y: strip.segments[i].y1 - bound.lowestY + (canvasElem.height - stripHeight) / 2,
                type: strip.segments[i].type,
                index: points.length,
                segment: i
            });
        }
        points.push({
            x: strip.segments[i].x2 - bound.lowestX + (canvasElem.width - stripWidth) / 2,
            y: strip.segments[i].y2 - bound.lowestY + (canvasElem.height - stripHeight) / 2,
            type: SEGMENT_TYPE_LED,
            index: points.length,
            segment: i + 1
        });

        if (i + 1 < strip.segments.length) {
            points[points.length - 1].type = strip.segments[i + 1].type;
        }
    }

    calculateLeds();
    render();
}

//#endregion
//#region Utilities
//#region Load functions
/****************************************************************************/
/*!
 * @brief   Loads the text of elements in the selected language.
 */
/****************************************************************************/
function loadText() {
    //ascendLedAddressingTitleElem.textContent = TEXT_ASCEND_LED_ADDRESSING;
    //descendLedAddressingTitleElem.textContent = TEXT_DESCEND_LED_ADDRESSING;
    //startAddressTitleElem.textContent = TEXT_START_ADDRESS;
    //addressTitleElem.textContent = TEXT_ADDRESS;
    clearBtnElem.textContent = TEXT_CLEAR;
    resetBtnElem.textContent = TEXT_RESET;
    resetAddressingBtnElem.textContent = TEXT_RESET_ADDRESSING;
    saveBtnElem.textContent = TEXT_SAVE;
    cancelBtnElem.textContent = TEXT_CANCEL;
}

/****************************************************************************/
/*!
 * @brief   Loads the pixel addressing out of the database configuration.
 */
/****************************************************************************/
function loadLedAddressing() {
    for (let i = 0; i < strip.segments.length; i++) {
        /* Extra first point */
        if (i == 0) {
            points.push({
                x: strip.segments[i].x1,
                y: strip.segments[i].y1,
                type: strip.segments[i].type,
                index: points.length,
                segment: i
            });
        }

        points.push({
            x: strip.segments[i].x2,
            y: strip.segments[i].y2,
            type: SEGMENT_TYPE_LED,
            index: points.length,
            segment: i + 1
        });

        if (i + 1 < strip.segments.length) {
            points[points.length - 1].type = strip.segments[i + 1].type;
        }
    }

    render();
}

//#endregion
//#region Validators
/****************************************************************************/
/*!
 * @brief   Validates the ledstrip LED addressing.
 * @returns bool                    True if valid
 */
/****************************************************************************/
function validateLedstripLedAddressing() {
    if (strip.leds.length == 0) {
        banners.show({ title: TEXT_WARNING, message: TEXT_NO_OF_LEDS_CONFIGURED, type: "warning" });

        return false;
    }
    if (strip.leds.length > MAX_NUMBER_OF_LEDS) {
        banners.show({
            title: TEXT_ERROR,
            message: TEXT_MAXIMUM_NUMBER_OF_LEDS_REACHED,
            type: "warning"
        });

        return false;
    }

    let numberOfLedsZero = 0;
    for (let led of strip.leds) {
        if (led.address == 0) {
            numberOfLedsZero++;
        }
    }

    if (numberOfLedsZero == strip.leds.length) {
        banners.show({
            title: TEXT_WARNING,
            message: TEXT_INVALID_ADDRESSING_NO_ADDRESSES,
            type: "warning"
        });

        return false;
    }

    return true;
}

//#endregion
//#region Getters
/****************************************************************************/
/*!
 * @brief   Returns the highest configured LED address.
 * @returns integer                 Highest address
 */
/****************************************************************************/
function getHighestConfiguredAddress() {
    let highestAddress = 0;

    for (let led of strip.leds) {
        if (led.address > highestAddress) {
            highestAddress = led.address;
        }
    }

    if (highestAddress > 0) {
        highestAddress++;
    }

    return highestAddress;
}

/****************************************************************************/
/*!
 * @brief   Returns the number of LEDs in the specified segment.
 * @param   index                   Segment index
 * @returns integer                 Number of LEDs
 */
/****************************************************************************/
function getNumberOfLedsInSegment(index) {
    let numberOfLeds = 0;
    for (let led of strip.leds) {
        if (led.segment_index == index) {
            numberOfLeds++;
        }
    }

    return numberOfLeds;
}
//#endregion
//#endregion
