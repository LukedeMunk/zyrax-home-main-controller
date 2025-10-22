/******************************************************************************/
/*
 * File:    configure_led_addressing_page.js
 * Author:  Luke de Munk
 * Version: 0.9.0
 * 
 * Brief:   JavaScript for configuring the LED addressing. More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/
//#region Elements
/* Text elements */
const toggleSegmentTypeTitleElem = document.getElementById("toggleSegmentTypeTitle");
const ascendLedAddressingTitleElem = document.getElementById("ascendLedAddressingTitle");
const descendLedAddressingTitleElem = document.getElementById("descendLedAddressingTitle");
const addressTitleElem = document.getElementById("addressTitle");

/* Fields */
const instructionMessageFieldElem = document.getElementById("instructionMessageField");
const drawingElementFieldElem = document.getElementById("drawingElementField");


/* Buttons */
const clearBtnElem = document.getElementById("clearBtn");
const resetBtnElem = document.getElementById("resetBtn");
const resetAddressingBtnElem = document.getElementById("resetAddressingBtn");
const saveBtnElem = document.getElementById("saveBtn");
const cancelBtnElem = document.getElementById("cancelBtn");

/* Icons */
const drawingElementIconElem = document.getElementById("drawingElementIcon");
const toggleSegmentTypeIconElem = document.getElementById("toggleSegmentTypeIcon");

/* Input elements */
const addressTxtElem = document.getElementById("addressTxt");

/* Tables */

/* Modals */

/* Other */
const segmentMouseMenuElem = document.getElementById("segmentMouseMenu");
const addressingMenuOptionsContainerElem = document.getElementById("addressingMenuOptionsContainer");

const ledMouseMenuElem = document.getElementById("ledMouseMenu");

const toolbarContainerElem = document.getElementById("toolbarContainer");
const canvasElem = document.getElementById("ledCanvas");
const ctx = canvasElem.getContext("2d");
//#endregion

//#region Constants
const LED_SPACING = 10;
const LED_RADIUS = 5;
const POINT_RADIUS = LED_RADIUS + 5;
const SNAP_POINT = 10;
const SEGMENT_LINE_COLOR = "rgb(240, 240, 240)";
const SELECTED_SEGMENT_LINE_COLOR = "rgba(82, 171, 255, 1)";
const INACTIVE_COLOR = "black";
const ACTIVE_COLOR = "rgb(240, 240, 240)";
const LED_ADDRESS_COLOR = "black";
const COLOR_TEXT = "rgb(240, 240, 240)";
const POINT_COLOR = "rgb(110, 110, 110)";
const CANVAS_WIDTH = 800;//TODO set canvas width
//#endregion

//#region Variables
let currentStrip;                                                               //For storing a backup of the current configuration
let selectedSegmentIndex = null;                                                //Selected segment for dragging
let selectedPointIndex = null;                                                  //Selected point for dragging
let selectedLedIndex = -1;
let isDragging = false;
let hasDragged = false;
let isDrawing = false;
let numberOfPointsBeforeDrawing = 0;
let points = [];
let dragLastPos = null;
let drawSegmentType = SEGMENT_TYPE_LED;
let addressingOrder = ASCENDING;
let mouseMenu;

let contextMenuItems = [
    {text: TEXT_MAKE_LED_SEGMENT, icon: "fa-solid fa-lightbulb", onclickFunction: "toggleSegmentType();"},
    {text: TEXT_ASSIGN_ADDRESSES, icon: "fa-solid fa-list-ol", submenu: [
        {text: TEXT_ASSENDING/*, icon: size.icon*/, onclickFunction: "ascendAddressing();"},
        {text: TEXT_DESCENDING/*, icon: size.icon*/, onclickFunction: "descendAddressing();"}
    ]}
];

let ledMenuItems = [
    {text: TEXT_ASSIGN_ADDRESS, icon: "fa-solid fa-list-ol", onclickFunction: "toggleSegmentType();"}
];
//#endregion

//#region Event listeners
/* Input fields */
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

/******************************************************************************/
/*!
  @brief    When page finished loading, this function is executed.
*/
/******************************************************************************/
$(document).ready(function() {
    loadText();
    toolbarContainerElem.style.width = CANVAS_WIDTH + "px";

    currentStrip = structuredClone(strip);
    
    if (strip.segments.length == 0) {
        printInstructionMessage(TEXT_NO_ADDRESSING_CONFIGURATION_START_DRAWING, MESSAGE_TYPE_WARNING);
        isDrawing = true;
        numberOfPointsBeforeDrawing = 0;    //No LEDs, so no points yet
    } else {
        printInstructionMessage(TEXT_ADDRESSING_CONFIGURATION_LOADED, MESSAGE_TYPE_SUCCESS);
        loadLedAddressing();
    }

    toggleSegmentType(SEGMENT_TYPE_LED);
});

//#region Configuration functions
/******************************************************************************/
/*!
  @brief    Resets the whole configuration.
*/
/******************************************************************************/
function resetAll() {
    points = [];
    selectedSegmentIndex = null;
    render();
}

/******************************************************************************/
/*!
  @brief    Loads the current saved configuration.
*/
/******************************************************************************/
function loadCurrent() {
    points = [];
    selectedSegmentIndex = null;
    strip = structuredClone(currentStrip);
    loadLedAddressing();
}

/******************************************************************************/
/*!
  @brief    Resets the addresses of all the LEDs.
*/
/******************************************************************************/
function resetAddressing() {
    for (let led of strip.leds) {
        if (led.segment_index != parseInt(selectedSegmentIndex)) {
            continue;
        }

        led.address = 0;
    }

    render();
}

/******************************************************************************/
/*!
  @brief    Toggles the segment type.
  @param    type                Type to set
  @param    drawingSegmentType  If true, the segment type for drawing is toggled
*/
/******************************************************************************/
function toggleSegmentType(type=undefined, drawingSegmentType=false) {
    if (type == undefined) {
        //toggleSegmentMouseContextMenu(false);
        if (drawingSegmentType) {
            drawSegmentType = !drawSegmentType;
            if (points.length > 0) {
                points[points.length-1].type = drawSegmentType;
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
            points[points.length-1].type = drawSegmentType;
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

/******************************************************************************/
/*!
  @brief    Saves the LED addressing by sending it to the back-end.
*/
/******************************************************************************/
function save() {
    if (!validateLedstripLedAddressing()) {
        return;
    }
    
    centerStrip();

    strip.leds.map(obj => {
        delete obj.x;
        delete obj.y;
    });

    let data = {
        id: strip.id,
        leds: strip.leds,
        segments: getSegments(points)
    }

    let result = httpPostRequestJsonReturn("/update_ledstrip_leds", data, false, true);
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageLedstripFieldElem.style.display = "inline-block";
        errorMessageLedstripFieldElem.textContent = result.message;
        return;
    }

    showBanner(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
    currentStrip = structuredClone(strip);
}

/******************************************************************************/
/*!
  @brief    Gives the selected segment LEDs an ascending addresses.
*/
/******************************************************************************/
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

/******************************************************************************/
/*!
  @brief    Gives the selected segment LEDs a descending addresses.
*/
/******************************************************************************/
function descendAddressing() {
    let startAddress = addressTxtElem.value;
    let numberOfLedsInSegment = getNumberOfLedsInSegment(selectedSegmentIndex)
    if (startAddress+1 - numberOfLedsInSegment < 0) {
        showBanner(TEXT_ERROR, TEXT_START_ADDRESS_TO_LOW, BANNER_TYPE_ERROR);
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
document.addEventListener("keydown", function(e) {
    if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        points.pop()
        render()
    }
});

canvasElem.addEventListener("contextmenu", (e) => {
    e.preventDefault();
});

/* Mouse button released */
canvasElem.addEventListener("mousedown", (e) => {
    let position = getCanvasMousePosition(e);

    if (e.button === 0) {
        e.preventDefault();
        leftMouseDown(position);
    } else if (e.button == 2) {
        rightMouseDown(position);
    }
});

/* Dragging segment or point on mousemove (only when right button dragging) */
canvasElem.addEventListener("mousemove", (e) => {
    let position = getCanvasMousePosition(e);

    if (isDragging) {
        calculateDragPosition(position);
        return;
    }

    if (isDrawing) {
        drawNewSegment(position);
    }
});

/* Mouse button released */
canvasElem.addEventListener("mouseup", (e) => {
    let position = getCanvasMousePosition(e);

    if (e.button === 0) {
        leftMouseUp(position);
    } else if (e.button == 2) {
        rightMouseUp(position);
    }
});
//#endregion

/******************************************************************************/
/*!
  @brief    Executed when left mouse button is pressed.
  @param    position            Mouse position (X, Y)
*/
/******************************************************************************/
function leftMouseDown(position) {
    //console.log("leftMouseDown");
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

/******************************************************************************/
/*!
  @brief    Executed when right mouse button is pressed.
  @param    position            Mouse position (X, Y)
*/
/******************************************************************************/
function rightMouseDown(position) {
    //console.log("rightMouseDown");
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
        return
    }

    let segmentIndex = findSegmentAtPosition(position.x, position.y);
    if (segmentIndex !== -1) {
        selectedSegmentIndex = segmentIndex;
        isDragging = true;
        dragLastPos = position;
    }

    render();
}

/******************************************************************************/
/*!
  @brief    Executed when left mouse button is lifted.
  @param    position            Mouse position (X, Y)
*/
/******************************************************************************/
function leftMouseUp(position) {
    //console.log("leftMouseUp");
    if (mouseMenu != undefined) {
        mouseMenu.destroy();
    }

    if (isDrawing) {
        isDrawing = false;
        return;
    }

    if (selectedLedIndex !== -1) {
        mouseMenu = generateMouseContextMenu(ledMenuItems, undefined, LEFT_MOUSE_BUTTON);
        mouseMenu.show({top: position.y, left: position.x});
        addressTxtElem.value = strip.leds[selectedLedIndex].address;
    }
}

/******************************************************************************/
/*!
  @brief    Executed when right mouse button is lifted.
  @param    position            Mouse position (X, Y)
*/
/******************************************************************************/
function rightMouseUp(position) {
    //console.log("rightMouseUp");
    if (mouseMenu != undefined) {
        mouseMenu.destroy();
    }
    
    if (!isDragging) {
        return;
    }

    isDragging = false;
    
    if (!hasDragged && selectedSegmentIndex !== null) {
        if (strip.segments[selectedSegmentIndex].type == SEGMENT_TYPE_LED) {
            contextMenuItems[0].text = TEXT_MAKE_INACTIVE_SEGMENT;
            contextMenuItems[0].icon = "fa-duotone fa-solid fa-horizontal-rule";
        } else {
            contextMenuItems[0].text = TEXT_MAKE_LED_SEGMENT;
            contextMenuItems[0].icon = "fa-duotone fa-solid fa-lightbulb";
        }
        mouseMenu = generateMouseContextMenu(contextMenuItems);
        //mouseMenu.show(position);
    } else {
        selectedSegmentIndex = null;
        selectedPointIndex = null;
    }

    render();
}

/******************************************************************************/
/*!
  @brief    Drags the selected segment to the specified location.
  @param    dx                  Delta X
  @param    dy                  Delta Y
*/
/******************************************************************************/
function dragSegment(dx, dy) {
    if (selectedSegmentIndex === null) {
        return;
    }

    let p1 = points[selectedSegmentIndex];
    let p2 = points[selectedSegmentIndex+1];

    let newP1 = {x: p1.x + dx, y: p1.y + dy};
    let newP2 = {x: p2.x + dx, y: p2.y + dy};

    // Constrain to horizontal or vertical
    if (Math.abs(newP2.x - newP1.x) > Math.abs(newP2.y - newP1.y)) {
        newP2.y = newP1.y;
    } else {
        newP2.x = newP1.x;
    }

    points[selectedSegmentIndex].x = newP1.x;
    points[selectedSegmentIndex].y = newP1.y;
    points[selectedSegmentIndex+1].x = newP2.x;
    points[selectedSegmentIndex+1].y = newP2.y;

    render();
}

/******************************************************************************/
/*!
  @brief    Drags the selected point to the specified location.
  @param    dx                  Delta X
  @param    dy                  Delta Y
*/
/******************************************************************************/
function dragPoint(dx, dy) {
    if (selectedPointIndex === null) {
        return;
    }

    let p1 = points[selectedPointIndex];

    let newP1 = {x: p1.x + dx, y: p1.y + dy};

    points[selectedPointIndex] = newP1;

    render();
}

/******************************************************************************/
/*!
  @brief    Calculates whether a new segment has to be drawn and adds a new
            segment if needed.
  @param    position            X, Y position
*/
/******************************************************************************/
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

/******************************************************************************/
/*!
  @brief    Calculates whether the segment is dragged and drags the segment if
            needed.
  @param    position            X, Y position
*/
/******************************************************************************/
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

function printInstructionMessage(message, messageType=undefined) {
    instructionMessageFieldElem.textContent = message;

    if (messageType) {
        instructionMessageFieldElem.className = "message " + messageType;
    }
}
//#endregion

//#region Canvas functions
/******************************************************************************/
/*!
  @brief    Calculates the LEDs for the canvas based on the configured points.
  @returns  array               Array with LED objects
*/
/******************************************************************************/
function calculateLeds() {
    let leds = [];

    for (let i = 1; i < points.length; i++) {
        let dx = points[i].x - points[i-1].x;
        let dy = points[i].y - points[i-1].y;
        let length = Math.sqrt(dx*dx + dy*dy);
        let numberOfLedsInSegment = Math.floor(length / LED_SPACING);
        let nx = dx / length;
        let ny = dy / length;

        if (strip.segments[i-1].type == SEGMENT_TYPE_INACTIVE) {
            continue;
        }

        for (let j = 0; j <= numberOfLedsInSegment; j++) {
            let x = Math.floor(parseFloat(points[i-1].x) + nx * LED_SPACING * j);
            let y = parseFloat(points[i-1].y) + ny * LED_SPACING * j;

            if (leds.length > 0 && leds[leds.length-1].x == x && leds[leds.length-1].y == y) {
                continue;
            }

            leds.push({
                x, y,
                index: leds.length,
                address: 0,
                segment_index: i-1
            });

            if (leds.length-1 < strip.leds.length) {
                leds[leds.length-1].address = parseInt(strip.leds[leds.length-1].address);
            }
        }
    }

    return leds;
}

/******************************************************************************/
/*!
  @brief    Renders the configuration on the canvas.
*/
/******************************************************************************/
function render() {
    ctx.clearRect(0, 0, canvasElem.width, canvasElem.height);

    if (points.length < 2) {
        for (let point of points) {
            renderPoint(point);
        }
        return;
    }

    /* Draw lines */
    ctx.lineWidth = 4;
    for (let i = 0; i < points.length - 1; i++) {
        ctx.beginPath();
        if (i === selectedSegmentIndex) {
            ctx.strokeStyle = SELECTED_SEGMENT_LINE_COLOR;
        } else {
            ctx.strokeStyle = points[i].type == SEGMENT_TYPE_LED ? SEGMENT_LINE_COLOR : INACTIVE_COLOR;
        }
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
        ctx.stroke();
    }

    /* Draw vertices */
    for (let point of points) {
        renderPoint(point);
    }

    /* Draw LEDs */
    strip.leds = calculateLeds();
    for (let led of strip.leds) {
        if (strip.segments[led.segment_index].type == SEGMENT_TYPE_LED) {
            renderLed(led);
        }
    }

    /* Draw total LED count near last point */
    if (points.length > 0) {
        ctx.fillStyle = COLOR_TEXT;
        ctx.font = "14px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(VAR_TEXT_TOTAL_LEDS(strip.leds.length), points[points.length-1].x + 15, points[points.length-1].y - 15);

        for (let segment of strip.segments) {
            let p1 = {x: 0, y: 0};
            let p2 = {x: 0, y: 0};
            let index = 0;
            for (let point of points) {
                if (point.segment == segment.segment_index) {
                    p1.x = point.x;
                    p1.y = point.y;
                    p2.x = points[index+1].x;
                    p2.y = points[index+1].y;

                    break;
                }

                index++;
            }
            let x;
            let y;

            if (segment.segment_index == strip.segments.length-1 && isDrawing) {
                x = points[points.length-1].x;
                y = points[points.length-1].y - 15;
            } else {
                x = (p1.x + p2.x) / 2;
                y = (p1.y + p2.y) / 2;
            }

            ctx.fillText(VAR_TEXT_LEDS_IN_SEGMENT(getNumberOfLedsInSegment(segment.segment_index)), x + 15, y - 15);
        }
    }
}

/******************************************************************************/
/*!
  @brief    Draws the specified point on the canvas.
  @param    point               Point to draw
*/
/******************************************************************************/
function renderPoint(point) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, POINT_RADIUS, 0, 2*Math.PI);

    if (selectedPointIndex !== null && point.index == selectedPointIndex) {
        ctx.fillStyle = SELECTED_SEGMENT_LINE_COLOR;
    } else {
        ctx.fillStyle = POINT_COLOR;
    }
    
    ctx.fill();
}

/******************************************************************************/
/*!
  @brief    Draws the specified LED on the canvas.
  @param    led                 LED to draw
*/
/******************************************************************************/
function renderLed(led) {
    ctx.beginPath();
    ctx.arc(led.x, led.y, LED_RADIUS, 0, 2*Math.PI);

    if (led.segment_index == selectedSegmentIndex || led.index == selectedLedIndex) {
        ctx.fillStyle = SELECTED_SEGMENT_LINE_COLOR;
    } else if (strip.segments[led.segment_index].type == SEGMENT_TYPE_LED) {
        ctx.fillStyle = ACTIVE_COLOR;
    } else {
        ctx.fillStyle = INACTIVE_COLOR;
    }
    
    ctx.fill();

    ctx.fillStyle = LED_ADDRESS_COLOR;
    ctx.font = "bold 9px sans-serif ";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(led.address, led.x, led.y,);
}

/******************************************************************************/
/*!
  @brief    Snaps the two specified points to the specified angle step.
  @param    p1                  Point 1
  @param    p2                  Point 2
  @param    stepDeg             Snap step in degrees (e.g. 90, 45, 11.25)
  @returns  object              Snapped X and Y
*/
/******************************************************************************/
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

/******************************************************************************/
/*!
  @brief    Returns the mouse position within the canvas.
  @param    event               Mouse event
  @returns  object              X and Y
*/
/******************************************************************************/
function getCanvasMousePosition(event) {
    const rect = canvasElem.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

/******************************************************************************/
/*!
  @brief    Returns the LED at the specified position. Or -1 when no LED is on
            that location.
  @param    x                   X position
  @param    y                   Y position
  @returns  integer             LED index
*/
/******************************************************************************/
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

/******************************************************************************/
/*!
  @brief    Returns the segment at the specified position. Or -1 when no segment
            is on that location.
  @param    x                   X position
  @param    y                   Y position
  @returns  integer             Segment index
*/
/******************************************************************************/
function findSegmentAtPosition(x, y) {
    for (let i = 0; i < points.length-1; i++) {
        if (pointToSegmentDistance({x,y}, points[i], points[i+1]) <= 8) {
            return i;
        }
    }

    return -1;
}

/******************************************************************************/
/*!
  @brief    Returns the point at the specified position. Or -1 when no point is
            on that location.
  @param    x                   X position
  @param    y                   Y position
  @returns  integer             Point index
*/
/******************************************************************************/
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

/******************************************************************************/
/*!
  @brief    Calculates the distance between the specified point and segment.
  @param    P                   Point
  @param    A                   Segment endpoint A
  @param    B                   Segment endpoint B
  @returns  integer             Distance between the point and segment
*/
/******************************************************************************/
function pointToSegmentDistance(P, A, B) {
    const ABx = B.x - A.x;
    const ABy = B.y - A.y;
    const APx = P.x - A.x;
    const APy = P.y - A.y;
    const AB_len_sq = ABx*ABx + ABy*ABy;
    let t = (APx*ABx + APy*ABy) / AB_len_sq;
    t = Math.max(0, Math.min(1, t));
    const closestX = A.x + ABx*t;
    const closestY = A.y + ABy*t;
    const dx = P.x - closestX;
    const dy = P.y - closestY;

    return Math.sqrt(dx*dx + dy*dy);
}

/******************************************************************************/
/*!
  @brief    Centers the strip on the canvas.
*/
/******************************************************************************/
function centerStrip() {
    let bound = determineStripCanvasBounds(strip);

    let stripWidth = bound.highestX - bound.lowestX;
    let stripHeight = bound.highestY - bound.lowestY;

    points = [];
    for (let i = 0; i < strip.segments.length; i++) {
        if (i == 0) {
            points.push({
                x: strip.segments[i].x1-bound.lowestX+(canvasElem.width-stripWidth)/2,
                y: strip.segments[i].y1-bound.lowestY+(canvasElem.height-stripHeight)/2,
                type: strip.segments[i].type,
                index: points.length,
                segment: i
            })
        }
        points.push({
            x: strip.segments[i].x2-bound.lowestX+(canvasElem.width-stripWidth)/2,
            y: strip.segments[i].y2-bound.lowestY+(canvasElem.height-stripHeight)/2,
            type: SEGMENT_TYPE_LED,
            index: points.length,
            segment: i+1
        })

        if (i + 1 < strip.segments.length) {
            points[points.length-1].type = strip.segments[i + 1].type
        }
    }

    calculateLeds();
    render();
}
//#endregion

//#region Utilities
//#region Load functions
/******************************************************************************/
/*!
  @brief    Loads the text of elements in the selected language.
*/
/******************************************************************************/
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

/******************************************************************************/
/*!
  @brief    Loads the pixel addressing out of the database configuration.
*/
/******************************************************************************/
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
            })
        }

        points.push({
            x: strip.segments[i].x2,
            y: strip.segments[i].y2,
            type: SEGMENT_TYPE_LED,
            index: points.length,
            segment: i+1
        })

        if (i + 1 < strip.segments.length) {
            points[points.length-1].type = strip.segments[i + 1].type
        }
    }
    
    render();
}
//#endregion

//#region Validators
/******************************************************************************/
/*!
  @brief    Validates the ledstrip LED addressing.
  @returns  bool                True if valid
*/
/******************************************************************************/
function validateLedstripLedAddressing() {
    if (strip.leds.length == 0) {
        showBanner(TEXT_WARNING, TEXT_NO_OF_LEDS_CONFIGURED, BANNER_TYPE_WARNING);
        return false;
    }
    if (strip.leds.length > MAX_NUMBER_OF_LEDS) {
        showBanner(TEXT_ERROR, TEXT_MAXIMUM_NUMBER_OF_LEDS_REACHED, BANNER_TYPE_WARNING);
        return false;
    }

    let numberOfLedsZero = 0;
    for (let led of strip.leds) {
        if (led.address == 0) {
            numberOfLedsZero++;
        }
    }

    if (numberOfLedsZero == strip.leds.length) {
        showBanner(TEXT_WARNING, TEXT_INVALID_ADDRESSING_NO_ADDRESSES, BANNER_TYPE_WARNING);
        return false;
    }

    return true;
}
//#endregion

//#region Getters
/******************************************************************************/
/*!
  @brief    Returns the highest configured LED address.
  @returns  integer             Highest address
*/
/******************************************************************************/
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

/******************************************************************************/
/*!
  @brief    Returns the number of LEDs in the specified segment.
  @param    index               Segment index
  @returns  integer             Number of LEDs
*/
/******************************************************************************/
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
