/******************************************************************************/
/*
 * File:    realtime_led_coloring_page.js
 * Author:  Luke de Munk
 * Version: 0.9.0
 * 
 * Brief:   JavaScript for the real-time LED coloring page. More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/
//#region Elements
/* Text elements */
const colorSegmentTitleElem = document.getElementById("colorSegmentTitle");
const drawingToolsTitleElem = document.getElementById("drawingToolsTitle");
const colorTitleElem = document.getElementById("colorTitle");
const colorGradientCbTitleElem = document.getElementById("colorGradientCbTitle");

/* Fields */
/* Buttons */
const colorAllBtnElem = document.getElementById("colorAllBtn");
const clearColorsBtnElem = document.getElementById("clearColorsBtn");

/* Icons */
const toggleSegmentTypeIconElem = document.getElementById("toggleSegmentTypeIcon");


/* Input elements */
const colorColorElem = document.getElementById("colorColor");
const colorGradientCbElem = document.getElementById("colorGradientCb");

/* Tables */

/* Modals */

/* Other */
const segmentMouseMenuElem = document.getElementById("segmentMouseMenu");
const addressingMenuOptionsContainerElem = document.getElementById("addressingMenuOptionsContainer");
const startAddressInputContainerElem = document.getElementById("startAddressInputContainer");
const ledMouseMenuElem = document.getElementById("ledMouseMenu");
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

const BLACK_COLOR = new Color("#000");

const NO_ANIMATION = 0
const PROPAGATE_ANIMATION = 0
const UPDATE_INTERVAL = 100;
//#endregion

//#region Variables
let isDrawing = false;
let points = [];
let selectedSegmentIndex = null;
let mouseContextMenuVisible = false;

let pencilColor = new Color("#FFF")
let useGradient = false;
let gradientPosition = 0;

let drawingInterval = null;
let lastDrawnLedIndex = -1;
//#endregion

//#region Event listeners
/* Dragging segment or point on mousemove (only when right button dragging) */
canvasElem.addEventListener("mousemove", (e) => {
    let position = getCanvasMousePosition(e);
    draw(position);
});

// Touch
canvasElem.addEventListener("touchmove", (e) => {
    e.preventDefault(); // Voorkom scrollen
    let position = getCanvasTouchPosition(e);
    draw(position);
}, { passive: false });

canvasElem.addEventListener("touchstart", (e) => {
    let position = getCanvasTouchPosition(e);
    startDrawing(position);
});

canvasElem.addEventListener("touchend", (e) => {
    stopDrawing();
});

canvasElem.addEventListener("mouseleave", (e) => {
    if (isDrawing) {
        stopDrawing();
    }
});

canvasElem.addEventListener("mouseenter", (e) => {
    if (e.buttons & 1) {
        isDrawing = true;
    }
});

/* Prevent default context menu */
canvasElem.addEventListener("contextmenu", (e) => {
    e.preventDefault();
});

/* Left or right click on the canvasElem */
canvasElem.addEventListener("mousedown", (e) => {
    let position = getCanvasMousePosition(e);

    if (e.button === 0) {
        leftMouseDown(position);
    } else if (e.button == 2) {
        setMouseContextMenuPosition({left:e.pageX, top:e.pageY})
        toggleSegmentMouseContextMenu(false);
        rightMouseDown(position);
    }
});

/* Drawing done */
canvasElem.addEventListener("mouseup", (e) => {
    let position = getCanvasMousePosition(e);
    if (e.button === 0) {
        leftMouseUp(position);
    } else if (e.button == 2) {
        setMouseContextMenuPosition({left:e.pageX, top:e.pageY})
        rightMouseUp(position);
    }
});
//#endregion

/******************************************************************************/
/*!
  @brief    When page finished loading, this function is executed.
*/
/******************************************************************************/
$(document).ready(function() {
    colorColorElem.value = pencilColor.toHex();

    loadLeds();
    clearColors(false);
});
//#endregion

//#region Coloring functionality
/******************************************************************************/
/*!
  @brief    Sets the pencil color.
*/
/******************************************************************************/
function setPencilColor() {
    if (useGradient) {
        useGradient = false;
        colorGradientCbElem.checked = false;
    }
    
    pencilColor.setFromHex(colorColorElem.value);
}

/******************************************************************************/
/*!
  @brief    Enables or disables the use of a color gradient.
*/
/******************************************************************************/
function setGradient() {
    useGradient = colorGradientCbElem.checked;
    gradientPosition = 0;
    
    pencilColor.setFromHex(colorColorElem.value);
}

/******************************************************************************/
/*!
  @brief    Resets all the LEDs to black.
  @param    send                If true, the reset command is sended to the
                                back-end
*/
/******************************************************************************/
function clearColors(send=true) {
    for (let led of strip.leds) {
        led.color = BLACK_COLOR.clone();
    }
    
    if (send) {
        sendLedColors(true);
    }

    render();
}

/******************************************************************************/
/*!
  @brief    Colors all the LEDs with the selected color.
*/
/******************************************************************************/
function colorAll() {
    for (let led of strip.leds) {
        if (useGradient) {
            pencilColor.setFromHex(colorWheel(gradientPosition));
            colorColorElem.value = pencilColor.toHex();
            gradientPosition++;
        }
        updateLedColors(led.index, pencilColor.clone());
    }
    
    sendLedColors(true);
    render();
}

/******************************************************************************/
/*!
  @brief    Colors all the LEDs in the selected segment with the selected
            color.
*/
/******************************************************************************/
function colorSegment() {
    toggleSegmentMouseContextMenu(false);
    if (selectedSegmentIndex === -1) {
        return;
    }
    console.log(strip.leds[0])
    console.log(selectedSegmentIndex)
    console.log(strip.segments)

    for (let led of strip.leds) {
        if (led.segment_index == selectedSegmentIndex) {
            if (useGradient) {
                pencilColor.setFromHex(colorWheel(gradientPosition));
                colorColorElem.value = pencilColor.toHex();
                gradientPosition++;
            }
            updateLedColors(led.index, pencilColor.clone())
        }
    }

    render();
    sendLedColors(true);
}

/******************************************************************************/
/*!
  @brief    Sends the LEDs to the back-end.
  @param    forceSend           If true, the command is send. Even if there is
                                no LED change
*/
/******************************************************************************/
function sendLedColors(forceSend=false) {
    if (!forceSend && lastDrawnLedIndex == -1) {
        return;
    }
    
    let ledColors = strip.leds.map(led => led.color.toHex());
    let url = "/draw_realtime_leds";

    httpPostRequest(url, {id: strip.id, leds: ledColors}, true);
}

/******************************************************************************/
/*!
  @brief    Sets the specified color to the specified LED.
  @param    index               LED index
  @param    color               Color to set
*/
/******************************************************************************/
function updateLedColors(index, color) {
    let selectedAddress = strip.leds[index].address;
    for (let led of strip.leds) {
        if (led.address == selectedAddress) {
            led.color = color.clone();
        }
    }
}
//#endregion

//#region Utilities
//#region Canvas functions
/******************************************************************************/
/*!
  @brief    Calculates the LEDs for the canvas based on the configured points.
*/
/******************************************************************************/
function calculateLeds() {
    let ledIndex = 0;

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

        if (i == points.length-1) {
            numberOfLedsInSegment++;
        }

        for (let j = 0; j < numberOfLedsInSegment; j++) {
            let x = Math.floor(points[i-1].x + nx * LED_SPACING * j);
            let y = points[i-1].y + ny * LED_SPACING * j;

            strip.leds[ledIndex].x = x;
            strip.leds[ledIndex].y = y;
            ledIndex++;
        }
    }
}

/******************************************************************************/
/*!
  @brief    Renders the drawn LEDs on the canvas.
*/
/******************************************************************************/
function render() {
    ctx.clearRect(0, 0, canvasElem.width, canvasElem.height);

    if (points.length < 2) {
        return;
    }

    // Draw lines
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

    /* Draw LEDs */
    for (let led of strip.leds) {
        renderLed(led);
    }
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
    ctx.fillStyle = led.color.toHex();

    ctx.fill();
}

/******************************************************************************/
/*!
  @brief    Returns the mouse position within the canvas.
  @param    event               Mouse event
  @returns  object              X and Y
*/
/******************************************************************************/
function getCanvasMousePosition(event) {
    let rect = canvasElem.getBoundingClientRect();

    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

/******************************************************************************/
/*!
  @brief    Returns the touch position within the canvas.
  @param    event               Touch event
  @returns  object              X and Y
*/
/******************************************************************************/
function getCanvasTouchPosition(event) {
    let rect = canvasElem.getBoundingClientRect();
    let touch = event.touches[0];

    return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
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
//#endregion

//#region Mouse event functions
/******************************************************************************/
/*!
  @brief    Executed when left mouse button is pressed.
  @param    position            Mouse position (X, Y)
*/
/******************************************************************************/
function leftMouseDown(position) {
    toggleSegmentMouseContextMenu(false);
    startDrawing(position);
}

/******************************************************************************/
/*!
  @brief    Executed when right mouse button is pressed.
  @param    position            Mouse position (X, Y)
*/
/******************************************************************************/
function rightMouseDown(position) {
    let segmentIndex = findSegmentAtPosition(position.x, position.y);
    if (segmentIndex !== -1) {
        selectedSegmentIndex = segmentIndex;
    } else {
        selectedSegmentIndex = null;
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
    stopDrawing();
}

/******************************************************************************/
/*!
  @brief    Executed when right mouse button is lifted.
  @param    position            Mouse position (X, Y)
*/
/******************************************************************************/
function rightMouseUp(position) {
    if (selectedSegmentIndex !== null) {
        toggleSegmentMouseContextMenu(true);
        render();
    }
}

/******************************************************************************/
/*!
  @brief    Start of drawing LEDs.
  @param    position            Mouse position (X, Y)
*/
/******************************************************************************/
function startDrawing(position) {
    isDrawing = true;
    lastDrawnLedIndex = -1;

    /* Start update interval */
    if (!drawingInterval) {
        drawingInterval = setInterval(() => {
            sendLedColors();
        }, UPDATE_INTERVAL);
    }

    let selectedLedIndex = findLedAtPosition(position.x, position.y);
    if (selectedLedIndex !== -1) {
        lastDrawnLedIndex = selectedLedIndex;
        if (useGradient) {
            pencilColor.setFromHex(colorWheel(gradientPosition));
            colorColorElem.value = pencilColor.toHex();
            gradientPosition++;
        }
        updateLedColors(selectedLedIndex, pencilColor.clone());
        render();
    }
}

/******************************************************************************/
/*!
  @brief    Draws selected LEDs.
  @param    position            Mouse position (X, Y)
*/
/******************************************************************************/
function draw(position) {
    if (!isDrawing) {
        return;
    }

    let selectedLedIndex = findLedAtPosition(position.x, position.y);
    lastDrawnLedIndex = selectedLedIndex;
    if (selectedLedIndex === -1) {
        return;
    }

    if (useGradient) {
        pencilColor.setFromHex(colorWheel(gradientPosition));
        colorColorElem.value = pencilColor.toHex();
        gradientPosition++;
    }

    updateLedColors(selectedLedIndex, pencilColor.clone());
    render();
}

/******************************************************************************/
/*!
  @brief    Stops the LED drawing, sends the LEDs one more time to synchronize
            the strip.
*/
/******************************************************************************/
function stopDrawing() {
    if (drawingInterval) {
        clearInterval(drawingInterval);
        drawingInterval = null;
    }

    if (isDrawing) {
        isDrawing = false;
        lastDrawnLedIndex = -1;
        sendLedColors(true);
    }
}

/******************************************************************************/
/*!
  @brief    Toggles the mouse context menu.
  @param    element             Element to show
  @param    show                Show state to set
*/
/******************************************************************************/
function toggleMouseContextMenu(element, show=undefined) {
    if (show != undefined) {
        mouseContextMenuVisible = show;
    } else {
        mouseContextMenuVisible = !mouseContextMenuVisible;
    }

    if (!mouseContextMenuVisible) {
        element.style.display = "none";
        return;
    }
    
    element.style.display = "block";

    if (element == segmentMouseMenuElem) {
        
    }
};

/******************************************************************************/
/*!
  @brief    Toggles the segment mouse context menu.
  @param    show                Show state to set
*/
/******************************************************************************/
function toggleSegmentMouseContextMenu(show=undefined) {
    toggleMouseContextMenu(segmentMouseMenuElem, show);
};

/******************************************************************************/
/*!
  @brief    Sets the mouse context menu to the specified position.
  @param    top                 Top position
  @param    left                Left position
*/
/******************************************************************************/
const setMouseContextMenuPosition = ({ top, left }) => {
    segmentMouseMenuElem.style.left = `${left}px`;
    segmentMouseMenuElem.style.top = `${top}px`;
};
//#endregion

//#region Load functions
/******************************************************************************/
/*!
  @brief    Loads the text of elements in the selected language.
*/
/******************************************************************************/
function loadText() {
    colorSegmentTitleElem.textContent = TEXT_COLOR_SEGMENT;
    drawingToolsTitleElem.textContent = TEXT_DRAWING_TOOLS;
    colorTitleElem.textContent = TEXT_COLOR;
    colorGradientCbTitleElem.textContent = TEXT_USE_GRADIENT;
    colorAllBtnElem.textContent = TEXT_COLOR_ALL;
    clearColorsBtnElem.textContent = TEXT_CLEAR;
}

/******************************************************************************/
/*!
  @brief    Loads the ledstrip database configuration in the UI.
*/
/******************************************************************************/
function loadLeds() {
    let bound = determineStripCanvasBounds(strip);
    canvasElem.width = bound.highestX - bound.lowestX + CANVAS_PADDING;
    canvasElem.height = bound.highestY - bound.lowestY + CANVAS_PADDING;

    for (let i = 0; i < strip.segments.length; i++) {
        if (i == 0) {
            points.push({
                x: strip.segments[i].x1-bound.lowestX+(CANVAS_PADDING/2),
                y: strip.segments[i].y1-bound.lowestY+(CANVAS_PADDING/2),
                type: strip.segments[i].type,
                index: points.length,
                segment: i
            })
        }
        points.push({
            x: strip.segments[i].x2-bound.lowestX+(CANVAS_PADDING/2),
            y: strip.segments[i].y2-bound.lowestY+(CANVAS_PADDING/2),
            type: SEGMENT_TYPE_LED,
            index: points.length,
            segment: i+1
        })

        if (i + 1 < strip.segments.length) {
            points[points.length-1].type = strip.segments[i + 1].type
        }
    }
    strip.segments = getSegments(points);
    calculateLeds();
}
//#endregion
//#endregion