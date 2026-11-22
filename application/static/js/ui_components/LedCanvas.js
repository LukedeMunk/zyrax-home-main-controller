/****************************************************************************/
/*
 * File:    LedCanvas.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Draws strip geometry, addresses and live colors for both LED
 *          editors.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import { Component } from "../../vendor/templates/js/core/component.js";
import { VAR_TEXT_TOTAL_LEDS, VAR_TEXT_LEDS_IN_SEGMENT } from "../domain/language_pack_english.js";

export class LedCanvas extends Component {
    /****************************************************************************/
    /*!
     * @brief   Draws strip segments, LED colors, addresses and selection labels.
     */
    /****************************************************************************/
    render() {
        const {
            points = [],
            leds = [],
            segments = [],
            addressing,
            selectedSegment,
            selectedPoint,
            selectedLed,
            drawing
        } = this.props;
        const ctx = this.root.getContext("2d");
        const style = getComputedStyle(this.root);
        const selectedColor = style.getPropertyValue("--icon-blue");
        const activeColor = style.getPropertyValue("--text");
        const inactiveColor = style.getPropertyValue("--muted-text");
        const labelColor = style.getPropertyValue("--background1");

        ctx.clearRect(0, 0, this.root.width, this.root.height);
        ctx.lineWidth = 4;

        for (let i = 0; i < points.length - 1; i++) {
            ctx.beginPath();
            ctx.strokeStyle = i === selectedSegment
                ? selectedColor
                : points[i].type === 1
                ? activeColor
                : inactiveColor;
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[i + 1].x, points[i + 1].y);
            ctx.stroke();
        }

        if (addressing) {
            for (const point of points) {
                circle(ctx, point, 10, point.index === selectedPoint
                    ? selectedColor
                    : inactiveColor);
            }
        }
        if (points.length < 2) return;

        for (const led of leds) {
            if (addressing && segments[led.segment_index]?.type !== 1) continue;

            const selected = led.segment_index === selectedSegment || led.index === selectedLed;
            const color = addressing ? selected ? selectedColor : activeColor : led.color.toHex();

            circle(ctx, led, 5, color);
            if (addressing) {
                ctx.fillStyle = labelColor;
                ctx.font = "bold 9px sans-serif";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(led.address, led.x, led.y);
            }
        }

        if (!addressing) return;

        const last = points[points.length - 1];
        ctx.fillStyle = activeColor;
        ctx.font = "14px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(VAR_TEXT_TOTAL_LEDS(leds.length), last.x + 15, last.y - 15);

        for (const [i, segment] of segments.entries()) {
            const start = points[i],
                end = points[i + 1];
            if (!end) continue;

            const tail = drawing && i === segments.length - 1;
            const x = tail ? last.x : (start.x + end.x) / 2;
            const y = tail ? last.y - 15 : (start.y + end.y) / 2;
            const count = leds.filter(led => led.segment_index === segment.segment_index).length;

            ctx.fillText(VAR_TEXT_LEDS_IN_SEGMENT(count), x + 15, y - 15);
        }
    }

    /****************************************************************************/
    /*!
     * @brief   Converts a pointer or touch event to LED canvas coordinates.
     * @param   event                   Event reported by the bound control.
     * @returns Pointer position in canvas coordinates.
     */
    /****************************************************************************/
    position(event) {
        const point = event.touches?.[0] ?? event;
        const rect = this.root.getBoundingClientRect();

        return {
            x: (point.clientX - rect.left) * this.root.width / rect.width,
            y: (point.clientY - rect.top) * this.root.height / rect.height
        };
    }
}

/****************************************************************************/
/*!
 * @brief   Draws a filled LED or control point on the canvas.
 * @param   ctx                     Canvas rendering context.
 * @param   point                   Canvas point to draw.
 * @param   radius                  Circle radius in canvas pixels.
 * @param   color                   Fill color.
 */
/****************************************************************************/
function circle(ctx, point, radius, color) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}
