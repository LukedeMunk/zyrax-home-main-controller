/******************************************************************************/
/*
 * File:    base.js
 * Author:  Luke de Munk
 * Version: 0.9.0
 * 
 * Brief:   Global JavaScript code for the application. More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/
//#region Elements
let navBarProfilePictureElem;
//#endregion

//#region Constants
const THEME_LIST = ["dark", "light", "dark-green", "light-green"];

const TYPES = [TEXT_LEDSTRIPS, TEXT_RF_DEVICES, TEXT_CAMERAS];
const DEVICE_TYPE_LEDSTRIP = 0
const DEVICE_TYPE_RF_DEVICE = 1
const DEVICE_TYPE_IP_CAMERA = 2

const AUTOMATION_TRIGGER_TIMER = 0;
const AUTOMATION_TRIGGER_SENSOR = 1;
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
    {triggerType: AUTOMATION_TRIGGER_SENSOR, icon: "fa-duotone fa-solid fa-door-open fa-lg"},
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
const MODE_DRAWING = 50;

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

/* Dashboard tiles */
const TILE_TYPE_DEVICE = 0
const TILE_TYPE_GROUP = 1
const TILE_TYPE_DATETIME = 2
const TILE_TYPE_WEATHER = 3
const TILE_TYPE_ALARM = 4

const TILE_SIZE_1X1 = 0
const TILE_SIZE_1X2 = 1
const TILE_SIZE_4X2 = 2
const TILE_SIZE_2X4 = 3
const TILE_SIZE_4X4 = 4

const MAX_NUMBER_OF_TILES = 100;
const TILE_SIZES = [
    {size: TILE_SIZE_1X1, description: TEXT_MAKE_1X1_TILE, icon: "fa-duotone fa-solid fa-down-left-and-up-right-to-center"},
    {size: TILE_SIZE_1X2, description: TEXT_MAKE_1X2_TILE, icon: "fa-duotone fa-solid fa-expand"},
    {size: TILE_SIZE_4X2, description: TEXT_MAKE_4X2_TILE, icon: "fa-duotone fa-solid fa-expand-wide"},
    {size: TILE_SIZE_2X4, description: TEXT_MAKE_2X4_TILE, icon: "fa-duotone fa-solid fa-expand-wide"},
    {size: TILE_SIZE_4X4, description: TEXT_MAKE_4X4_TILE, icon: "fa-duotone fa-solid fa-expand"}
]

/* Ledstrip mode parameters */
const PARAMETER_NAME_MIN_COLOR_POS = "min_color_pos";
const PARAMETER_NAME_MAX_COLOR_POS = "max_color_pos";
const PARAMETER_NAME_COLOR1 = "color1";
const PARAMETER_NAME_COLOR2 = "color2";
const PARAMETER_NAME_USE_GRADIENT1 = "use_gradient1";
const PARAMETER_NAME_USE_GRADIENT2 = "use_gradient2";
const PARAMETER_NAME_DELAY = "delay";
const PARAMETER_NAME_SEGMENT_SIZE = "segment_size";
const PARAMETER_NAME_TAIL_LENGTH = "tail_length";
const PARAMETER_NAME_WAVE_LENGTH = "wave_length";
const PARAMETER_NAME_TIME_FADE = "time_fade";
const PARAMETER_NAME_DELAY_BETWEEN = "delay_between";
const PARAMETER_NAME_RANDOMNESS_DELAY = "randomness_delay";
const PARAMETER_NAME_INTENSITY = "intensity";
const PARAMETER_NAME_DIRECTION = "direction";
const PARAMETER_NAME_NUMBER_OF_ELEMENTS = "number_of_elements";
const PARAMETER_NAME_PALETTE = "palette";
const PARAMETER_NAME_FADE_LENGTH = "fade_length";
const MODE_PARAMETERS = [
                            PARAMETER_NAME_MIN_COLOR_POS,
                            PARAMETER_NAME_MAX_COLOR_POS,
                            PARAMETER_NAME_COLOR1,
                            PARAMETER_NAME_COLOR2,
                            PARAMETER_NAME_USE_GRADIENT1,
                            PARAMETER_NAME_USE_GRADIENT2,
                            PARAMETER_NAME_DELAY,
                            PARAMETER_NAME_SEGMENT_SIZE,
                            PARAMETER_NAME_TAIL_LENGTH,
                            PARAMETER_NAME_WAVE_LENGTH,
                            PARAMETER_NAME_TIME_FADE,
                            PARAMETER_NAME_DELAY_BETWEEN,
                            PARAMETER_NAME_RANDOMNESS_DELAY,
                            PARAMETER_NAME_INTENSITY,
                            PARAMETER_NAME_DIRECTION,
                            PARAMETER_NAME_NUMBER_OF_ELEMENTS,
                            PARAMETER_NAME_PALETTE,
                            PARAMETER_NAME_FADE_LENGTH
                        ];

const MODE_PARAMETER_TYPE_COLOR_RANGE = 0
const MODE_PARAMETER_TYPE_COLOR = 1
const MODE_PARAMETER_TYPE_CHECKBOX = 2
const MODE_PARAMETER_TYPE_RANGE = 3
const MODE_PARAMETER_TYPE_DIRECTION_CHECKBOX = 4
const MODE_PARAMETER_TYPE_SELECT = 5


const RF_CODE_TYPE_ACTIVE = 0
const RF_CODE_TYPE_INACTIVE = 1
const RF_CODE_TYPE_TRIGGERED = 2
const RF_CODE_TYPE_LOW_BATTERY = 3

const MAX_NUMBER_OF_LEDS = 250

const CANVAS_PADDING = 40;

const MAX_LEDSTRIP_BRIGHTNESS = 250;
const FETCH_TIMEOUTS_BEFORE_RECONNECT = 5;

const ASCENDING = 0;
const DESCENDING = 1;

const SEGMENT_TYPE_INACTIVE = 0;
const SEGMENT_TYPE_LED = 1;

const PAGES = [AUTOMATIONS_PAGE,
                DASHBOARD_PAGE,
                CONFIGURATION_PAGE,
                LEDSTRIP_PAGE,
                SENSOR_PAGE,
                ALARM_PAGE];

const NAVIGATION_BAR_ITEMS = [
    {pages: [AUTOMATIONS_PAGE], text: "Automations", link: "./automations", icon: "fa-duotone fa-calendar-week"},
    {pages: [DASHBOARD_PAGE, LEDSTRIP_PAGE, SENSOR_PAGE, ALARM_PAGE], text: "Dashboard", link: "./", icon: "fa-duotone fa-grid-horizontal"},
    {pages: [CONFIGURATION_PAGE], text: "Configuration", link: "./configuration", icon: "fa-duotone fa-sliders"},
    {pages: [], onclickFunction: "openProfileNavigationBarDialog();", image: "/get_profile_picture", elementId: "navBarProfilePicture"}
];

const MESSAGE_TYPE_SUCCESS = "success";
const MESSAGE_TYPE_WARNING = "warning";
const MESSAGE_TYPE_ERROR = "error";
//#endregion

//#region Variables
let fetchTimeouts = 0;
let profileId = undefined;
let remember = false;
//#endregion



/******************************************************************************/
/*!
  @brief    When page finished loading, this function is executed.
*/
/******************************************************************************/
$(document).ready(function() {
    /* Load theme cookie */
    let savedTheme = sessionStorage.getItem("theme");
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        setTheme(PREFERS_DARK ? 0 : 1);
    }
    
    document.body.classList.add("loaded");                                      //For CSS incoming animations
    generateNavigationBar(NAVIGATION_BAR_ITEMS);
    
    /* Load remember cookie */
    if (localStorage.getItem("remember") != undefined && localStorage.getItem("remember") != "") {
        remember = localStorage.getItem("remember") == "true";
    }

    /* Load selected profile ID cookie */
    if (remember) {
        if (localStorage.getItem("profileId") != undefined && localStorage.getItem("profileId") != "") {
            profileId = parseInt(localStorage.getItem("profileId"));
        }
    } else {
        if (sessionStorage.getItem("profileId") != undefined && sessionStorage.getItem("profileId") != "") {
            profileId = parseInt(sessionStorage.getItem("profileId"));
        }
    }

    if (page != LOGIN_PAGE && page != INITIAL_SETUP_PAGE) {
        if (profileId == undefined) {
            redirect("/login")
        }
    }

    loadModalCloseButtons();

    let buttons = [
                    {text: TEXT_DEACTIVATE, onclickFunction: "deactivateAlarm();"}
                ];
                
    if (alarmActivated) {
        showPopup(TEXT_ALARM_ACTIVATED, TEXT_Q_DEACTIVATE_ALARM, buttons, BANNER_TYPE_WARNING);
    }

    navBarProfilePictureElem = document.getElementById("navBarProfilePicture");
    navBarProfilePictureElem.addEventListener("mouseenter", function (e) {
        openProfileNavigationBarDialog();
    });
});
//#endregion

//#region Utilities
/******************************************************************************/
/*!
  @brief    Waits until the client is connected to the webserver again.
  @param    functionAfterConnected  Function that gets called when finished
*/
/******************************************************************************/
async function waitUntilConnected(functionAfterConnected) {
    try {
        var response = await fetch("check_connection", {signal: AbortSignal.timeout(FETCH_TIMEOUT)});
    } catch {
        setTimeout(waitUntilConnected, BACK_END_UPDATE_INTERVAL_1S, functionAfterConnected);
        return;
    }

    /* If is not ready, look again in one second */
    if (response.status != HTTP_CODE_OK) {
        setTimeout(waitUntilConnected, BACK_END_UPDATE_INTERVAL_1S, functionAfterConnected);
        return;
    }

    /* When ready, do this */
    closeLoadingBanner();
    showBanner(TEXT_BACK_ONLINE, TEXT_BACK_ONLINE, BANNER_TYPE_SUCCESS);
    setTimeout(functionAfterConnected, 10);
}

//#region OTA Utilities
/******************************************************************************/
/*!
  @brief    Converts the specified version string (vX.X.X) to a version object.
  @param    versionString       String of the version
  @returns  versionObject       Version object
*/
/******************************************************************************/
function versionStringToObject(versionString) {
    versionString = versionString.replace("v", "");
    versionString = versionString.replaceAll("_", ".");

    let versionArray = versionString.split(".");
    let versionObject = {
        major: 0,
        minor: 0,
        patch: 0
    };

    versionObject.major = versionArray[0];
    versionObject.minor = versionArray[1];
    versionObject.patch = versionArray[2];

    return versionObject;
}

/******************************************************************************/
/*!
  @brief    Converts the specified version object to a version string.
  @param    versionObject       Version object
  @returns  versionString       String of the version
*/
/******************************************************************************/
function versionObjectToString(versionObject) {
    let versionString = versionObject.major + ".";
    versionString += versionObject.minor + ".";
    versionString += versionObject.patch;

    return versionString;
}

/******************************************************************************/
/*!
  @brief    Checks whether the specified version is obsolete or not.
  @param    version             Version to check
  @param    newestVersion       Newest version
  @returns  bool                True if the version is obsolete
*/
/******************************************************************************/
function isObsoleteVersion(version, newestVersion) {
    if (version.major > newestVersion.major) {
        return false;
    }
    if (version.major < newestVersion.major) {
        return true;
    }

    /* Major same */
    if (version.minor > newestVersion.minor) {
        return false;
    }
    if (version.minor < newestVersion.minor) {
        return true;
    }

    /* Minor same */
    if (version.patch > newestVersion.patch) {
        return false;
    }
    if (version.patch < newestVersion.patch) {
        return true;
    }

    /* Same versions */
    return false;
}

/******************************************************************************/
/*!
  @brief    Returns the hightest version that is ready to be installed.
  @returns  versionObject       Highest version ready to be installad
*/
/******************************************************************************/
function getHighestReadyVersion() {
    let highestVersion = {
        major: 0,
        minor: 0,
        patch: 0
    };

    for (let version of otaVersionsReady) {
        if (version.major < highestVersion.major) {
            continue;
        }
        
        if (version.minor < highestVersion.minor) {
            continue;
        }
        
        if (version.patch < highestVersion.patch) {
            continue;
        }
        highestVersion = version;
    }

    return highestVersion;
}

/******************************************************************************/
/*!
  @brief    Returns the version string out of the specified filename.
  @param    filename            Filename to get the version of
  @returns  string              Version
*/
/******************************************************************************/
function getVersion(filename) {
    return filename.split(".")[0];
}

/******************************************************************************/
/*!
  @brief    Checks if the specified array has the specified version in it.
  @param    fileList            Array to check
  @param    version             Version string to look for
  @returns  bool                True if array contains the specified version
*/
/******************************************************************************/
function hasVersion(fileList, version) {
    for (let file of fileList) {
        if (getVersion(file.filename) == version) {
            return true;
        }
    }
    
    return false;
}
//#endregion

/******************************************************************************/
/*!
  @brief    Deactivates the alarm.
*/
/******************************************************************************/
function deactivateAlarm() {
    closePopup();
    let result = httpPostRequestJsonReturn("/update_alarm", {activated: 0});
    
    if (result.status_code != HTTP_CODE_OK) {
        showBanner(TEXT_ERROR, result.message, BANNER_TYPE_ERROR);
        errorMessageLedstripFieldElem.style.display = "inline-block";
        errorMessageLedstripFieldElem.textContent = result.message;
        return;
    }
    
    showBanner(TEXT_SUCCESS, TEXT_ALARM_DEACTIVATED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
}

/******************************************************************************/
/*!
  @brief    Returns the color of the specified color position.
  @param    position        Color position (0-255)
  @returns  string          HEX string of the color
*/
/******************************************************************************/
function colorWheel(position) {
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

    let color = new Color({r, g, b});

    return color.toHex();
}

/******************************************************************************/
/*!
  @brief    Returns the CSS classname of the specified tile size.
  @param    size            Tile size
  @returns  string          Classname of the tile
*/
/******************************************************************************/
function getClassFromSize(size) {
    switch (size) {
        case TILE_SIZE_1X1:
            return "tile single"
        case TILE_SIZE_1X2:
            return "tile"
        case TILE_SIZE_4X2:
            return "tile double-horizontal"
        case TILE_SIZE_2X4:
            return "tile double-vertical"
        case TILE_SIZE_4X4:
            return "tile double-horizontal-vertical"
    }
}

/******************************************************************************/
/*!
  @brief    Determines the lowest and highest X and Y for the specified
            ledstrip.
  @param    strip               Strip configuration
  @returns  object              Bounds object
*/
/******************************************************************************/
function determineStripCanvasBounds(strip) {
    let bound = {
        lowestX: 1000,
        lowestY: 1000,
        highestX: 0,
        highestY: 0
    }
    
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

/******************************************************************************/
/*!
  @brief    Returns the segments drawn on the canvas.
  @param    points              Point configuration of the ledstrip
  @returns  array               Array with segments
*/
/******************************************************************************/
function getSegments(points) {
    let segments = [];
    for (let i = 0; i < points.length-1; i++) {
        let p1 = points[i];
        let p2 = points[i+1];
        segments.push({
            segment_index: i,
            type: p1.type,
            x1: p1.x,
            y1: p1.y,
            x2: p2.x,
            y2: p2.y
        })
    }

    return segments;
}

/******************************************************************************/
/*!
  @brief    Scrolls to the specified DOM section.
  @param    sectionElement      DOM element to scroll to
*/
/******************************************************************************/
function scrollToSection(sectionElement) {
    const section = document.getElementById(sectionElement);

    const targetPosition = section.offsetTop;
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    const duration = 1000; // 1 second
    let start = null;

    // Cubic ease in-out function
    function easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function step(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        const time = Math.min(progress / duration, 1);
        const eased = easeInOutCubic(time);

        window.scrollTo(0, startPosition + distance * eased);

        if (progress < duration) {
            window.requestAnimationFrame(step);
        } else {
            // Add class to trigger fade-in after scrolling
            setTimeout(() => {
                section.classList.add("show");
            }, 50);
        }
    }

    window.requestAnimationFrame(step);
}
//#endregion




/******************************************************************************/
/*!
  @brief    Changes the profile.
  @param    id              ID of the profile
*/
/******************************************************************************/
function changeProfile(id, scrollDown=false) {
    if (remember) {
        localStorage.setItem("profileId", id);
    } else {
        sessionStorage.setItem("profileId", id);
    }

    let profile = userProfiles[getIndexFromId(userProfiles, id)];
    setTheme(profile.ui_theme);

    httpPostRequest("/pick_profile", {id: id});

    if (scrollDown) {
        scrollToSection("emptyContainer");
    }

    setTimeout(function() {redirect("./")}, 700);                               //Give some time for scrolling animation
}

/******************************************************************************/
/*!
  @brief    Generates and opens the navigation bar dialog with account options.
*/
/******************************************************************************/
function openProfileNavigationBarDialog() {
    const rect = navBarProfilePictureElem.getBoundingClientRect();

    let profileMenuItems = [
        {profiles: []},
        {text: "Manage profile", link: "./account#profileContainer", icon: "fa-duotone fa-regular fa-users"},
        {text: "Manage account", link: "./account#accountContainer", icon: "fa-duotone fa-regular fa-user"},
        {text: "Help", link: "https://zyraxhome.munkservices.com/", icon: "fa-duotone fa-solid fa-circle-info"},
        {text: "Log out", link: "./logout", icon: "fa-duotone fa-solid fa-arrow-right-to-arc"},
        {text: APPLICATION_VERSION}
    ];

    for (let profile of userProfiles) {
        profileMenuItems[0].profiles.push(
            {onclickFunction: "changeProfile(" + profile.id + ");", image: "/get_profile_picture?id=" + profile.id}
        );
    }
    
    /* Remove existing menu */
    document.querySelectorAll(".profile-menu").forEach(el => el.remove());

    let hideTimeout = null;

    /* Generate menu */
    const menu = document.createElement("div");
    menu.className = "profile-menu";

    /* Profile section */
    if (profileMenuItems[0].profiles.length > 0) {
        const profilesContainer = document.createElement("div");
        profilesContainer.className = "profiles";

        for (let p of profileMenuItems[0].profiles) {
            const img = document.createElement("img");
            img.src = p.image;
            img.onclick = () => { eval(p.onclickFunction); };
            profilesContainer.appendChild(img);
        }

        menu.appendChild(profilesContainer);
    }

    /* Menu items */
    for (let i = 1; i < profileMenuItems.length; i++) {
        let item = profileMenuItems[i];

        let entry = document.createElement("p");
        
        if (item.link) {
            entry = document.createElement("a");
            entry.href = item.link;
            if (item.link.includes("https://")) {
                entry.target = "_blank";                        //Open in new tab
                entry.rel = "noopener noreferrer";              //No access to window.opener
            }
        }

        if (item.icon) {
            let icon = document.createElement("i");
            icon.className = item.icon;
            entry.appendChild(icon);
        }

        let span = document.createElement("span");
        span.textContent = item.text;
        entry.appendChild(span);

        menu.appendChild(entry);
    }

    document.body.appendChild(menu);

    /* Position, requestAnimationFrame to be sure that everything is rendered correctly */
    requestAnimationFrame(() => {
        const menuHeight = menu.offsetHeight;
        const centerX = rect.left + rect.width / 2;
        const topY = rect.top;
        const verticalOffset = 12;

        menu.style.left = `${centerX}px`;
        menu.style.top = `${topY - menuHeight - verticalOffset}px`;

        menu.classList.add('show');
    });

    /*
     * Delay activating the outside-click listener so the opening
     * click doesn't instantly close the menu.
     */
    setTimeout(() => {
        const clickHandler = (e) => {
            if (!menu.contains(e.target) && e.target !== navBarProfilePictureElem) {
                // start sluitanimatie
                menu.classList.remove('show');
                menu.classList.add('hide');

                // verwijder na animatie
                menu.addEventListener('transitionend', () => menu.remove(), { once: true });
                document.removeEventListener('click', clickHandler);
            }
        };
        document.addEventListener('click', clickHandler);
    }, 0);
    
    window.addEventListener("scroll", () => {
        menu.classList.remove('show');
        menu.classList.add('hide');
    });
    window.addEventListener("contextmenu", () => {
        menu.classList.remove('show');
        menu.classList.add('hide');
    });
    
    /* Hover leave/enter */
    menu.addEventListener("mouseenter", () => {
        clearTimeout(hideTimeout);
    });

    menu.addEventListener("mouseleave", () => {
        hideTimeout = setTimeout(() => {
        menu.classList.remove('show');
        menu.classList.add('hide');}
        , 50);
    });
}

/******************************************************************************/
/*!
  @brief    Scrolls to the top of the page, ignoring the history.
*/
/******************************************************************************/
function scrollToTop() {
    if ("scrollRestoration" in history) {
        history.scrollRestoration = "manual";
    }
    
    window.scrollTo(0, 0);
}

/******************************************************************************/
/*!
  @brief    Redirects to the LED addressing page of the specified ledstrip.
  @param    id                  Device ID
*/
/******************************************************************************/
function updateLedAddressing(id) {
    redirect("/configure_led_addressing?id=" + id);
}


/******************************************************************************/
/*!
  @brief    Sets the UI theme.
  @param    theme               Theme name
*/
/******************************************************************************/
function setTheme(theme) {
    const root = document.documentElement;
    root.classList.remove("light", "dark", "dark-green", "light-green");
    root.classList.add(THEME_LIST[theme]);
    
    sessionStorage.setItem("theme", theme);
}