/******************************************************************************/
/*
 * File:    Color.js
 * Class:   Color
 * Author:  Luke de Munk
 * Version: 0.9.0
 * 
 * Brief:   Color class. More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/

class Color {
    constructor(input) {
        if (typeof input === 'string') {
            if (input.startsWith('#')) {
                this.setFromHex(input);
            } else if (input.startsWith('rgb')) {
                this.setFromRgbString(input);
            } else {
                throw new Error("Invalid color string format. Use '#rrggbb' or 'rgb(r, g, b)'.");
            }
        } else if (typeof input === 'object' && input !== null) {
            const { r, g, b } = input;
            this.setRGB(r, g, b);
        } else {
            throw new Error("Unsupported color input. Provide a string or {r,g,b} object.");
        }
    }
    
    clone() {
        return new Color({ r: this.r, g: this.g, b: this.b });
    }

    setFromHex(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
            throw new Error("Invalid hex color format. Must be 3 or 6 hex digits.");
        }

        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);

        this.setRGB(r, g, b);
    }

    setFromRgbString(rgbStr) {
        const match = rgbStr.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/);
        if (!match) {
            throw new Error("Invalid rgb() format. Use 'rgb(r, g, b)' with numbers 0–255.");
        }

        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);

        this.setRGB(r, g, b);
    }

    setRGB(r, g, b) {
        if (![r, g, b].every(v => Number.isInteger(v) && v >= 0 && v <= 255)) {
            throw new Error(`RGB values must be integers from 0 to 255. Got r=${r}, g=${g}, b=${b}`);
        }

        this.r = r;
        this.g = g;
        this.b = b;
    }

    toHex() {
        return '#' + [this.r, this.g, this.b]
            .map(x => x.toString(16).padStart(2, '0'))
            .join('');
    }

    toRgbString() {
        return `rgb(${this.r}, ${this.g}, ${this.b})`;
    }

    toObject() {
        return { r: this.r, g: this.g, b: this.b };
    }
}
