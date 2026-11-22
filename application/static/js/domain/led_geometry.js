/****************************************************************************/
/*
 * File:    led_geometry.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Computes LED segment geometry and gradient colors.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import { Color } from "./Color.js";

/****************************************************************************/
/*!
 * @brief   Converts a position on the color wheel to a hexadecimal RGB color.
 * @param   position                Position on the canvas or color wheel.
 * @returns Hexadecimal RGB color string.
 */
/****************************************************************************/
export function colorWheel(position) {
    position = position % 256;

    let r, g, b;

    if (position < 85) {
        r = position * 3;
        g = 255 - position * 3;
        b = 0;
    } else if (position < 170) {
        position -= 85;
        r = 255 - position * 3;
        g = 0;
        b = position * 3;
    } else {
        position -= 170;
        r = 0;
        g = position * 3;
        b = 255 - position * 3;
    }

    let color = new Color({ r, g, b });

    return color.toHex();
}

/****************************************************************************/
/*!
 * @brief   Calculates the canvas bounds required by a strip layout.
 * @param   strip                   LED strip configuration or name.
 * @returns Canvas layout bounds and adjusted strip points.
 */
/****************************************************************************/
export function determineStripCanvasBounds(strip) {
    let bound = { lowestX: 1000, lowestY: 1000, highestX: 0, highestY: 0 };

    for (let i = 0; i < strip.segments.length; i++) {
        if (i == 0) {
            if (bound.lowestX > strip.segments[i].x1) {
                bound.lowestX = strip.segments[i].x1;
            }
            if (bound.highestX < strip.segments[i].x1) {
                bound.highestX = strip.segments[i].x1;
            }
            if (bound.lowestY > strip.segments[i].y1) {
                bound.lowestY = strip.segments[i].y1;
            }
            if (bound.highestY < strip.segments[i].y1) {
                bound.highestY = strip.segments[i].y1;
            }
        }

        if (bound.lowestX > strip.segments[i].x2) {
            bound.lowestX = strip.segments[i].x2;
        }
        if (bound.highestX < strip.segments[i].x2) {
            bound.highestX = strip.segments[i].x2;
        }
        if (bound.lowestY > strip.segments[i].y2) {
            bound.lowestY = strip.segments[i].y2;
        }
        if (bound.highestY < strip.segments[i].y2) {
            bound.highestY = strip.segments[i].y2;
        }
    }

    return bound;
}

/****************************************************************************/
/*!
 * @brief   Builds strip segments from consecutive canvas points.
 * @param   points                  Ordered strip canvas points.
 * @returns Segments connecting the supplied canvas points.
 */
/****************************************************************************/
export function getSegments(points) {
    let segments = [];
    for (let i = 0; i < points.length - 1; i++) {
        let p1 = points[i];
        let p2 = points[i + 1];

        segments.push({ segment_index: i, type: p1.type, x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
    }

    return segments;
}
