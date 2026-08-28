/******************************************************************************/
/*
 * File:    base.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   Global JavaScript code for the application. More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 * 
 * Template version:        0.0.4
 * Template information:    https://github.com/LukedeMunk/templates
 */
/******************************************************************************/
//#region Elements
let navBarProfilePictureElem;
//#endregion

//#region Constants
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
//#endregion

//#region Variables
let fetchTimeouts = 0;
let profileId;
let rememberUser = false;
//#endregion

/******************************************************************************/
/*!
    @brief  When page finished loading, this function is executed.
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
    
    /* Load rememberUser cookie */
    if (localStorage.getItem("rememberUser") != undefined && localStorage.getItem("rememberUser") != "") {
        rememberUser = localStorage.getItem("rememberUser") == "true";
    }

    /* Load selected profile ID cookie */
    profileId = getSavedProfileId();

    if (page != LOGIN_PAGE && page != INITIAL_SETUP_PAGE) {
        if (profileId == undefined) {
            redirect("/login");
        }

        navigationBarObject.setConfiguration(NAVIGATION_BAR_CONFIGURATION);
        navigationBarObject.render();
    }

    loadModalCloseButtons();
                
    if (alarmActivated) {
        const buttons = [
                        {text: TEXT_DEACTIVATE, onclickFunction: () => deactivateAlarm()}
                    ];

        popups.show(TEXT_ALARM_ACTIVATED, TEXT_Q_DEACTIVATE_ALARM, buttons, MESSAGE_TYPE_WARNING);
    }
});
//#endregion

//#region Utilities
/******************************************************************************/
/*!
    @brief  Waits until the client is connected to the webserver again.
    @param  functionAfterConnected  Function that gets called when finished
*/
/******************************************************************************/
function getSavedProfileId() {
    if (rememberUser) {
        if (localStorage.getItem("profileId") != undefined && localStorage.getItem("profileId") != "") {
            return parseInt(localStorage.getItem("profileId"));
        }
    } else {
        if (sessionStorage.getItem("profileId") != undefined && sessionStorage.getItem("profileId") != "") {
            return parseInt(sessionStorage.getItem("profileId"));
        }
    }
}

/******************************************************************************/
/*!
    @brief  Waits until the client is connected to the webserver again.
    @param  functionAfterConnected  Function that gets called when finished
*/
/******************************************************************************/
async function waitUntilConnected(functionAfterConnected) {
    try {
        let response = await fetch("check_connection", {signal: AbortSignal.timeout(FETCH_TIMEOUT)});
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
    loadingBanners.closeAll();
    banners.show(TEXT_BACK_ONLINE, TEXT_BACK_ONLINE, MESSAGE_TYPE_SUCCESS);
    setTimeout(functionAfterConnected, 10);
}

//#region OTA Utilities
/******************************************************************************/
/*!
    @brief  Converts the specified version string (vX.X.X) to a version object.
    @param  versionString       String of the version
    @return versionObject       Version object
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
    @brief  Converts the specified version object to a version string.
    @param  versionObject       Version object
    @return versionString       String of the version
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
    @brief  Checks whether the specified version is obsolete or not.
    @param  version             Version to check
    @param  newestVersion       Newest version
    @return bool                True if the version is obsolete
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
    @brief  Returns the hightest version that is ready to be installed.
    @return versionObject       Highest version ready to be installad
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
    @brief  Returns the version string out of the specified filename.
    @param  filename            Filename to get the version of
    @return string              Version
*/
/******************************************************************************/
function getVersion(filename) {
    return filename.split(".")[0];
}

/******************************************************************************/
/*!
    @brief  Checks if the specified array has the specified version in it.
    @param  fileList            Array to check
    @param  version             Version string to look for
    @return bool                True if array contains the specified version
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
    @brief  Returns the color of the specified color position.
    @param  position        Color position (0-255)
    @return string          HEX string of the color
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
    @brief  Returns the CSS classname of the specified tile size.
    @param  size            Tile size
    @return string          Classname of the tile
*/
/******************************************************************************/
function getClassFromSize(size) {
    switch (size) {
        case TILE_SIZE_1X1:
            return "tile"
        case TILE_SIZE_1X2:
            return "tile tile1x2"
        case TILE_SIZE_2X2:
            return "tile tile2x2"
        case TILE_SIZE_2X4:
            return "tile tile2x4"
        case TILE_SIZE_4X4:
            return "tile tile4x4"
    }
}

/******************************************************************************/
/*!
    @brief  Determines the lowest and highest X and Y for the specified
            ledstrip.
    @param  strip               Strip configuration
    @return object              Bounds object
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
    @brief  Returns the segments drawn on the canvas.
    @param  points              Point configuration of the ledstrip
    @return array               Array with segments
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
    @brief  Scrolls to the specified DOM section.
    @param  sectionElement      DOM element to scroll to
*/
/******************************************************************************/
function scrollToSection(sectionElement) {
    const section = document.getElementById(sectionElement);

    const targetPosition = section.offsetTop;
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    const duration = 500; // 0.5 second
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
    @brief  Changes the profile.
    @param  id              ID of the profile
*/
/******************************************************************************/
function changeProfile(id, scrollDown=false) {
    if (rememberUser) {
        localStorage.setItem("profileId", id);
    } else {
        sessionStorage.setItem("profileId", id);
    }

    let profile = userProfiles[getIndexFromId(userProfiles, id)];
    setTheme(profile.ui_theme);

    httpPostRequestErrorBanner("/pick_profile", {id: id});

    if (scrollDown) {
        scrollToSection("emptyContainer");
    }

    setTimeout(function() {redirect("./")}, 700);                               //Give some time for scrolling animation
}

/******************************************************************************/
/*!
    @brief  Scrolls to the top of the page, ignoring the history.
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
    @brief  Redirects to the LED addressing page of the specified ledstrip.
    @param  id                  Device ID
*/
/******************************************************************************/
function updateLedAddressing(id) {
    redirect("/configure_led_addressing?id=" + id);
}

/******************************************************************************/
/*!
    @brief  Sets the UI theme.
    @param  theme               Theme name
*/
/******************************************************************************/
function setTheme(theme) {
    const root = document.documentElement;
    root.classList.remove("light", "dark", "dark-green", "light-green");
    root.classList.add(THEME_LIST[theme]);
    
    sessionStorage.setItem("theme", theme);
}


//#region Utilities
/******************************************************************************/
/*!
    @brief  Loads the UI language select options.
*/
/******************************************************************************/
function logout() {
    localStorage.removeItem("profileId");
    sessionStorage.removeItem("profileId");
    sessionStorage.removeItem("loggedIn");

    redirect('./logout');
}

/******************************************************************************/
/*!
    @brief  Loads the UI language select options.
*/
/******************************************************************************/
function loadLanguageSelectOptions(element) {
    element.innerHTML = "";
    
    for (let language of SUPPORTED_UI_LANGUAGES) {
        option = document.createElement("option");
        option.value = language.id;
        option.text = language.language;
        
        element.appendChild(option);
    }
}

/******************************************************************************/
/*!
    @brief  Loads the profiles into the select container.
    @param  profiles            Profiles to load
    @param  generateAddProfileTile  If true, add profile container is added
    @param  onclickFunction     Function to execute on click
*/
/******************************************************************************/
function loadProfileOptions(profiles, generateAddProfileTile=false, onclickFunction=changeProfile, highlightProfileId=undefined) {
    profileSelectContainerElem.innerHTML = "";

    for (let profile of profiles) {
        /* Container */
        const containerElem = document.createElement("div");
        containerElem.className = "profile-picture-upload";

        /* Label */
        const labelElem = document.createElement("label");
        labelElem.className = "profile-picture-upload-button";
        
        if (profile.id == highlightProfileId) {
            labelElem.classList.add("selected");
        }

        /* Image */
        const imageElem = document.createElement("img");
        imageElem.id = "profilePicturePreview" + profile.id;
        imageElem.src = "/get_profile_picture?id=" + profile.id + "&t=" + new Date().getTime();
        imageElem.onclick = () => onclickFunction(profile.id);

        labelElem.appendChild(imageElem);

        /* Subtitle */
        let subtitle = document.createElement("p");
        subtitle.style.fontWeight = "bold";
        subtitle.textContent = profile.name;

        containerElem.appendChild(labelElem);
        containerElem.appendChild(subtitle);

        profileSelectContainerElem.appendChild(containerElem);
    }

    if (generateAddProfileTile) {
        /* Container */
        const containerElem = document.createElement("div");
        containerElem.className = "profile-picture-upload";

        /* Label */
        const labelElem = document.createElement("label");
        labelElem.className = "profile-picture-upload-button";

        /* Image */
        const imageElem = document.createElement("img");
        imageElem.id = "profilePicturePreview";
        imageElem.src = "/get_default_profile_picture";
        imageElem.onclick = () => loadProfile(-1);

        labelElem.appendChild(imageElem);

        /* Subtitle */
        const titleElem = document.createElement("p");
        titleElem.style.fontWeight = "bold";
        titleElem.textContent = TEXT_ADD_PROFILE;

        containerElem.appendChild(labelElem);
        containerElem.appendChild(titleElem);

        profileSelectContainerElem.appendChild(containerElem);
    }
}
//#endregion

/******************************************************************************/
/*!
    @brief  Sets the specified icon to the specified DOM element.
    @param  icon                Icon to set
    @param  elementId           ID of the DOM element
*/
/******************************************************************************/
function pickIcon(icon, modalObject, buttonElementId, fieldElementId) {
    modalObject.setValue(fieldElementId, icon);
    modalObject.setIcon(buttonElementId, icon);
    iconPickerObject.close();
}
/******************************************************************************/
/*!
    @brief  Loads the icons for the specified element ID and shows the modal.
*/
/******************************************************************************/
function loadIconModal(buttonElementId, fieldElementId, modalId) {
    loadIconOptions(buttonElementId, fieldElementId, modalId);
    iconPickerObject.show();
}

/******************************************************************************/
/*!
    @brief  Loads the icon options.
*/
/******************************************************************************/
function loadIconOptions(buttonElementId, fieldElementId, modalId) {
    let modalObject;
    if (modalId == "groupModal") {
        modalObject = groupModalObject;
    } else if (modalId == "ledstripModal") {
        modalObject = ledstripModalObject;
    } else if (modalId == "rfDeviceModal") {
        modalObject = rfDeviceModalObject;
    } else {
        console.warn("Modal with ID " + modalId + " not found");
    }

    let iconOptions = []
    for (let icon of ICONS_XL) {
        iconOptions.push({
            icon: icon,
            onclickFunction: () => pickIcon(icon, modalObject, buttonElementId, fieldElementId)
        });
    }

    iconPickerObject.setIcons(iconOptions);
}