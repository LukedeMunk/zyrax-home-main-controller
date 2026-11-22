/****************************************************************************/
/*
 * File:    dashboard_tiles.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Tile types, dimensions and labels used by the dashboard.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import {
    TEXT_ALARM, TEXT_AUTOMATION, TEXT_DATETIME, TEXT_DEVICE, TEXT_GROUP, TEXT_MAKE_1X1_TILE,
    TEXT_MAKE_1X2_TILE, TEXT_MAKE_2X4_TILE, TEXT_MAKE_4X2_TILE, TEXT_MAKE_4X4_TILE, TEXT_WEATHER
} from "./language_pack_english.js";

export const TILE_TYPE_DEVICE = 0;
export const TILE_TYPE_GROUP = 1;
export const TILE_TYPE_DATETIME = 2;
export const TILE_TYPE_WEATHER = 3;
export const TILE_TYPE_ALARM = 4;
export const TILE_TYPE_AUTOMATION = 5;
export const TILE_TYPE_ADD = 6;
export const TILE_TYPE_SPACER = 100;

export const TILE_SIZE_1X1 = 0;
export const TILE_SIZE_1X2 = 1;
export const TILE_SIZE_2X2 = 2;
export const TILE_SIZE_2X4 = 3;
export const TILE_SIZE_4X4 = 4;

export const TILE_DIMENSIONS = {
    [TILE_SIZE_1X1]: { columns: 1, rows: 1 },
    [TILE_SIZE_1X2]: { columns: 1, rows: 2 },
    [TILE_SIZE_2X2]: { columns: 2, rows: 2 },
    [TILE_SIZE_2X4]: { columns: 1, rows: 4 },
    [TILE_SIZE_4X4]: { columns: 2, rows: 4 }
};

/****************************************************************************/
/*!
 * @brief   Returns the tile classes associated with a dashboard tile size.
 * @param   size                    Configured dashboard tile size.
 * @returns The tile classes associated with a dashboard tile size.
 */
/****************************************************************************/
export function getClassFromSize(size) {
    switch (size) {
        case TILE_SIZE_1X1:
            return "tile";
        case TILE_SIZE_1X2:
            return "tile tile1x2";
        case TILE_SIZE_2X2:
            return "tile tile2x2";
        case TILE_SIZE_2X4:
            return "tile tile2x4";
        case TILE_SIZE_4X4:
            return "tile tile4x4";
    }
}
export const TILE_TYPE_SELECT_OPTIONS = [{ value: -1, text: "" }, {
    value: TILE_TYPE_DEVICE,
    text: TEXT_DEVICE
}, { value: TILE_TYPE_GROUP, text: TEXT_GROUP }, {
    value: TILE_TYPE_DATETIME,
    text: TEXT_DATETIME
}, { value: TILE_TYPE_WEATHER, text: TEXT_WEATHER }, {
    value: TILE_TYPE_ALARM,
    text: TEXT_ALARM
}, { value: TILE_TYPE_AUTOMATION, text: TEXT_AUTOMATION }];

export const TILE_SIZES = [{
    size: TILE_SIZE_1X1,
    description: TEXT_MAKE_1X1_TILE,
    icon: "fa-duotone fa-solid fa-down-left-and-up-right-to-center"
}, {
    size: TILE_SIZE_1X2,
    description: TEXT_MAKE_1X2_TILE,
    icon: "fa-duotone fa-solid fa-expand"
}, {
    size: TILE_SIZE_2X2,
    description: TEXT_MAKE_4X2_TILE,
    icon: "fa-duotone fa-solid fa-expand-wide"
}, {
    size: TILE_SIZE_2X4,
    description: TEXT_MAKE_2X4_TILE,
    icon: "fa-duotone fa-solid fa-expand-wide"
}, { size: TILE_SIZE_4X4, description: TEXT_MAKE_4X4_TILE, icon: "fa-duotone fa-solid fa-expand" }];
