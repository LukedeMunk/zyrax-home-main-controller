/******************************************************************************/
/*
 * File:    globals.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   Global code that handles global constants and variables.
 * 
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 * 
 * Template version:        0.0.4
 * Template information:    https://github.com/LukedeMunk/templates
 */
/******************************************************************************/
//#region Elements
//#endregion

//#region Global constantes
/* Popup buttons */
function CANCEL_POPUP_BUTTON(resolve) {return {text: TEXT_CANCEL, onclickFunction: () => { popups.close(); resolve(CHOICE_OPTION_CANCEL); }}};
function CONTINUE_POPUP_BUTTON(resolve) {return {text: TEXT_CONTINUE, onclickFunction: () => { popups.close(); resolve(CHOICE_OPTION1); }}};
function DELETE_POPUP_BUTTON(resolve) {return {text: TEXT_DELETE, onclickFunction: () => { popups.close(); resolve(CHOICE_OPTION1); }}};






const THEME_LIST = ["dark", "light", "dark-green", "light-green"];

const TYPES = [TEXT_LEDSTRIPS, TEXT_RF_DEVICES, TEXT_CAMERAS];
const DEVICE_TYPE_LEDSTRIP = 0;
const DEVICE_TYPE_RF_DEVICE = 1;
const DEVICE_TYPE_IP_CAMERA = 2;

const GROUP_TYPE_SELECT_OPTIONS = [
    {value: -1, text: ""},
    {value: DEVICE_TYPE_LEDSTRIP, text: TEXT_LEDSTRIP},
    {value: DEVICE_TYPE_RF_DEVICE, text: TEXT_RF_DEVICE},
    {value: DEVICE_TYPE_IP_CAMERA, text: TEXT_IP_CAMERA},
]

const DEVICE_POWER_SELECT_OPTIONS = [
    {value: 1, text: TEXT_ON},
    {value: 0, text: TEXT_OFF},
]

const AUTOMATION_TRIGGER_TIMER = 0;
const AUTOMATION_TRIGGER_DOOR_SENSOR = 1;
const AUTOMATION_TRIGGER_MOTION_SENSOR = 2;
const AUTOMATION_TRIGGER_SWITCH = 3;

const AUTOMATION_ACTION_SET_DEVICE_POWER = "set_device_power";
const AUTOMATION_ACTION_SET_LEDSTRIP_COLOR = "set_ledstrip_color";
const AUTOMATION_ACTION_SET_LEDSTRIP_MODE = "set_ledstrip_mode";

const ICONS_XL = [
    "fa-duotone fa-solid fa-door-open fa-xl",
    "fa-duotone fa-solid fa-door-closed fa-xl",
    "fa-duotone fa-solid fa-window-frame fa-xl",
    "fa-duotone fa-solid fa-window-frame-open fa-xl",
    "fa-duotone fa-solid fa-camera-cctv fa-xl",
    "fa-duotone fa-solid fa-lightbulb fa-xl",
    "fa-duotone fa-solid fa-lightbulb-on fa-xl",
    "fa-duotone fa-solid fa-person fa-xl",
    "fa-duotone fa-solid fa-person-walking fa-xl",
    "fa-duotone fa-solid fa-person-rays fa-xl",
    "fa-duotone fa-solid fa-layer-group fa-xl",
    "fa-duotone fa-solid fa-sensor fa-xl",
    "fa-duotone fa-solid fa-film fa-xl",
    "fa-duotone fa-solid fa-list fa-xl",
    "fa-duotone fa-solid fa-gear fa-xl",
    "fa-duotone fa-solid fa-house fa-xl",
    "fa-duotone fa-solid fa-fort fa-xl",
    "fa-duotone fa-solid fa-hotel fa-xl",
    "fa-duotone fa-solid fa-car-building fa-xl",
    "fa-duotone fa-solid fa-building fa-xl",
    "fa-duotone fa-solid fa-restroom fa-xl",
    "fa-duotone fa-solid fa-user-minus fa-xl",
    "fa-duotone fa-solid fa-clock fa-xl",
    "fa-duotone fa-solid fa-computer-speaker fa-xl",
    "fa-duotone fa-solid fa-projector fa-xl",
    "fa-duotone fa-solid fa-sitemap fa-xl",
    "fa-duotone fa-solid fa-radar fa-xl",
    "fa-duotone fa-solid fa-books fa-xl",
    "fa-duotone fa-solid fa-warehouse fa-xl",
    "fa-duotone fa-solid fa-booth-curtain fa-xl"
]

const ICONS_L = [
    "fa-duotone fa-solid fa-door-open fa-lg",
    "fa-duotone fa-solid fa-door-closed fa-lg",
    "fa-duotone fa-solid fa-window-frame fa-lg",
    "fa-duotone fa-solid fa-window-frame-open fa-lg",
    "fa-duotone fa-solid fa-camera-cctv fa-lg",
    "fa-duotone fa-solid fa-lightbulb fa-lg",
    "fa-duotone fa-solid fa-lightbulb-on fa-lg",
    "fa-duotone fa-solid fa-person fa-lg",
    "fa-duotone fa-solid fa-person-walking fa-lg",
    "fa-duotone fa-solid fa-person-rays fa-lg",
    "fa-duotone fa-solid fa-layer-group fa-lg",
    "fa-duotone fa-solid fa-sensor fa-lg",
    "fa-duotone fa-solid fa-film fa-lg",
    "fa-duotone fa-solid fa-list fa-lg",
    "fa-duotone fa-solid fa-gear fa-lg",
    "fa-duotone fa-solid fa-house fa-lg",
    "fa-duotone fa-solid fa-fort fa-lg",
    "fa-duotone fa-solid fa-hotel fa-lg",
    "fa-duotone fa-solid fa-car-building fa-lg",
    "fa-duotone fa-solid fa-building fa-lg",
    "fa-duotone fa-solid fa-restroom fa-lg",
    "fa-duotone fa-solid fa-user-minus fa-lg",
    "fa-duotone fa-solid fa-clock fa-lg",
    "fa-duotone fa-solid fa-computer-speaker fa-lg",
    "fa-duotone fa-solid fa-projector fa-lg",
    "fa-duotone fa-solid fa-sitemap fa-lg",
    "fa-duotone fa-solid fa-radar fa-lg",
    "fa-duotone fa-solid fa-books fa-lg",
    "fa-duotone fa-solid fa-warehouse fa-lg",
    "fa-duotone fa-solid fa-booth-curtain fa-lg"
]

const AUTOMATION_ICONS = [
    {action: "set_device_power", icon: "fa-duotone fa-solid fa-power-off fa-lg"},
    {action: "set_ledstrip_color", icon: "fa-duotone fa-solid fa-palette fa-lg"},
    {action: "set_ledstrip_mode", icon: "fa-duotone fa-solid fa-wand-magic-sparkles fa-lg"}
]

const TRIGGER_TYPE_ICONS = [
    {triggerType: AUTOMATION_TRIGGER_TIMER, icon: "fa-duotone fa-solid fa-clock fa-lg"},
    {triggerType: AUTOMATION_TRIGGER_DOOR_SENSOR, icon: "fa-duotone fa-solid fa-door-open fa-lg"},
    {triggerType: AUTOMATION_TRIGGER_MOTION_SENSOR, icon: "fa-duotone fa-solid fa-person-walking fa-lg"},
    {triggerType: AUTOMATION_TRIGGER_SWITCH, icon: "fa-duotone fa-solid fa-light-switch fa-lg"}
]

const DEVICE_TYPE_ICONS = [
    {type: DEVICE_TYPE_LEDSTRIP, icon: "fa-duotone fa-solid fa-lightbulb fa-2x"},
    {type: DEVICE_TYPE_RF_DEVICE, icon: "fa-duotone fa-solid fa-door-open fa-2x"},
    {type: DEVICE_TYPE_IP_CAMERA, icon: "fa-duotone fa-solid fa-camera-cctv fa-2x"}
]

const DEVICE_CATEGORY_LEDSTRIP = 0;
const DEVICE_CATEGORY_DOOR_SENSOR = 1;
const DEVICE_CATEGORY_MOTION_SENSOR = 2;
const DEVICE_CATEGORY_SWITCH = 3;
const DEVICE_CATEGORY_REMOTE = 4;
const DEVICE_CATEGORY_POWER_OUTLET = 5;
const DEVICE_CATEGORY_IP_CAMERA = 6;

const NUMBER_OF_OTA_FILES = 1;
const EXTENSION_BIN = "bin";

/* Regular expressions */

/* Modes */
const MODE_COLOR = 1;
const MODE_FADE = 2;
const MODE_GRADIENT = 3;
const MODE_BLINK = 4;
const MODE_SCAN = 5;
const MODE_THEATER = 6;
const MODE_SINE = 7;
const MODE_BOUNCING_BALLS = 8;
const MODE_DISSOLVE = 9;
const MODE_SPARKLE = 10;
const MODE_FIREWORKS = 11;
const MODE_FIRE = 12;
const MODE_SWEEP = 13;
const MODE_COLOR_TWINKELS = 14;
const MODE_METEOR_RAIN = 15;
const MODE_COLOR_WAVES = 16;
const LEDSTRIP_MODE_ID_DRAWING = 100;

const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif"];
/* Time delays */
const FETCH_TIMEOUT = 4000;

/* Days */
const DAY_MONDAY = 0;
const DAY_TUESDAY = 1;
const DAY_WEDNESDAY = 2;
const DAY_THURSDAY = 3;
const DAY_FRIDAY = 4;
const DAY_SATURDAY = 5;
const DAY_SUNDAY = 6;
const DAYS_IN_WEEK = 7;

const PARAMETER_ID_COLOR_RANGE = 1;
const PARAMETER_ID_COLOR1 = 2;
const PARAMETER_ID_COLOR2 = 3;
const PARAMETER_ID_SEGMENT_SIZE = 4;
const PARAMETER_ID_TAIL_LENGTH = 5;
const PARAMETER_ID_WAVE_LENGTH = 6;
const PARAMETER_ID_TIME_FADE = 7;
const PARAMETER_ID_DELAY = 8;
const PARAMETER_ID_DELAY_BETWEEN = 9;
const PARAMETER_ID_RANDOMNESS_DELAY = 10;
const PARAMETER_ID_INTENSITY = 11;
const PARAMETER_ID_DIRECTION = 12;
const PARAMETER_ID_NUMBER_OF_ELEMENTS = 13;
const PARAMETER_ID_PALETTE = 14;
const PARAMETER_ID_FADE_LENGTH = 15;

const DAYS_TILE_SELECT_OPTIONS = [
    {id: "dayTile" + DAY_MONDAY, value: DAY_MONDAY, title: TEXT_MONDAY},
    {id: "dayTile" + DAY_TUESDAY, value: DAY_TUESDAY, title: TEXT_TUESDAY},
    {id: "dayTile" + DAY_WEDNESDAY, value: DAY_WEDNESDAY, title: TEXT_WEDNESDAY},
    {id: "dayTile" + DAY_THURSDAY, value: DAY_THURSDAY, title: TEXT_THURSDAY},
    {id: "dayTile" + DAY_FRIDAY, value: DAY_FRIDAY, title: TEXT_FRIDAY},
    {id: "dayTile" + DAY_SATURDAY, value: DAY_SATURDAY, title: TEXT_SATURDAY},
    {id: "dayTile" + DAY_SUNDAY, value: DAY_SUNDAY, title: TEXT_SUNDAY},
]
const AUTOMATION_TRIGGER_TILE_SELECT_OPTIONS = [{
		id: "automationTriggerTile" + AUTOMATION_TRIGGER_TIMER,
		value: AUTOMATION_TRIGGER_TIMER,
		icon: "fa-duotone fa-solid fa-clock fa-lg",
		title: TEXT_TIMER,
		onclickFunction: () => updateAutomationModalStepButtons()
	},
	{
		id: "automationTriggerTile" + AUTOMATION_TRIGGER_DOOR_SENSOR,
		value: AUTOMATION_TRIGGER_DOOR_SENSOR,
		icon: "fa-duotone fa-solid fa-door-open fa-lg",
		title: TEXT_CONTACT_SENSOR,
		onclickFunction: () => updateAutomationModalStepButtons()
	},
	{
		id: "automationTriggerTile" + AUTOMATION_TRIGGER_MOTION_SENSOR,
		value: AUTOMATION_TRIGGER_MOTION_SENSOR,
		icon: "fa-duotone fa-solid fa-person-walking fa-lg",
		title: TEXT_MOTION_SENSOR,
		onclickFunction: () => updateAutomationModalStepButtons()
	},
	{
		id: "automationTriggerTile" + AUTOMATION_TRIGGER_SWITCH,
		value: AUTOMATION_TRIGGER_SWITCH,
		icon: "fa-duotone fa-solid fa-light-switch fa-lg",
		title: TEXT_SWITCH,
		onclickFunction: () => updateAutomationModalStepButtons()
	},
]
/* Dashboard tiles */

const TILE_TYPE_SELECT_OPTIONS = [
    {value: -1, text: ""},
    {value: TILE_TYPE_DEVICE, text: TEXT_DEVICE},
    {value: TILE_TYPE_GROUP, text: TEXT_GROUP},
    {value: TILE_TYPE_DATETIME, text: TEXT_DATETIME},
    {value: TILE_TYPE_WEATHER, text: TEXT_WEATHER},
    {value: TILE_TYPE_ALARM, text: TEXT_ALARM},
    {value: TILE_TYPE_AUTOMATION, text: TEXT_AUTOMATION},
]

const MAX_NUMBER_OF_TILES = 100;
const TILE_SIZES = [
    {size: TILE_SIZE_1X1, description: TEXT_MAKE_1X1_TILE, icon: "fa-duotone fa-solid fa-down-left-and-up-right-to-center"},
    {size: TILE_SIZE_1X2, description: TEXT_MAKE_1X2_TILE, icon: "fa-duotone fa-solid fa-expand"},
    {size: TILE_SIZE_2X2, description: TEXT_MAKE_4X2_TILE, icon: "fa-duotone fa-solid fa-expand-wide"},
    {size: TILE_SIZE_2X4, description: TEXT_MAKE_2X4_TILE, icon: "fa-duotone fa-solid fa-expand-wide"},
    {size: TILE_SIZE_4X4, description: TEXT_MAKE_4X4_TILE, icon: "fa-duotone fa-solid fa-expand"}
]
//#endregion

//#region Global variables
const navigationBarObject = new FloatingNavigationBar();
const passwordModalObject = new PasswordModalForm();
const overlayObject = new Overlay();
const banners = new BannerManager();
const loadingBanners = new LoadingBannerManager({
    overlayObject: overlayObject,
    banners: banners
});
const popups = new PopupManager({overlayObject: overlayObject});
//#endregion

//#region Navigation bar configuration
const NAVIGATION_BAR_CONFIGURATION = {
    id: "navBar",
    location: "bottom",
    buttons: [
        {
            id: "automationsNavBtn",
            title: "",
            type: NAVIGATION_BUTTON_PAGE,
            pages: [AUTOMATIONS_PAGE],
            text: TEXT_AUTOMATIONS,
            link: "./automations",
            icon: "fa-duotone fa-calendar-week"
        },
        {
            id: "dashboardNavBtn",
            title: "",
            type: NAVIGATION_BUTTON_PAGE,
            pages: [DASHBOARD_PAGE, LEDSTRIP_PAGE, SENSOR_PAGE, ALARM_PAGE],
            text: TEXT_DASHBOARD,
            link: "./",
            icon: "fa-duotone fa-grid-horizontal",
        },
        {
            id: "configurationNavBtn",
            title: "",
            type: NAVIGATION_BUTTON_PAGE,
            pages: [CONFIGURATION_PAGE],
            text: TEXT_CONFIGURATION,
            link: "./configuration",
            icon: "fa-duotone fa-gears",
        },
        {
            id: "accountNavBtn",
            type: NAVIGATION_BUTTON_IMAGE,
            image: "/get_profile_picture",
            title: TEXT_ACCOUNT_INFORMATION,
            subItems: [
                {
                    id: "manageAccountNavBtn",
                    title: "",
                    icon: "fa-duotone fa-regular fa-users",
                    onclickFunction: () => redirect("./account#accountContainer"),
                    text: TEXT_MANAGE_PROFILE
                },
                {
                    id: "manageAccountNavBtn",
                    title: "",
                    icon: "fa-duotone fa-regular fa-user",
                    onclickFunction: () => redirect("./account#profileContainer"),
                    text: TEXT_MANAGE_ACCOUNT
                },
                {
                    id: "helpNavBtn",
                    title: "",
                    icon: "fa-duotone fa-solid fa-circle-info",
                    onclickFunction:() => redirect("https://zyraxhome.munkservices.com/"),
                    text: TEXT_HELP
                },
                {
                    id: "logoutNavBtn",
                    title: "",
                    icon: "fa-duotone fa-solid fa-arrow-right-to-arc",
                    onclickFunction:() => logout(),
                    text: TEXT_LOGOUT
                },
                {
                    id: "versionNavBtn",
                    text: CURRENT_APPLICATION_VERSION
                }
            ]
        }
    ]
};
//#endregion
