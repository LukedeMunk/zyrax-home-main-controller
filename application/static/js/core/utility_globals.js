/******************************************************************************/
/*
 * File:    utility_globals.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   Global code that handles global constants and variables.
 *          
 *          This code must be seen as 'read-only', so that template updates can
 *          be rolled out without much work. Put all the global objects in
 *          'globals.js' and all the global functions in 'base.js'.
 * 
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 * 
 * Template version:        0.0.4
 * Template information:    https://github.com/LukedeMunk/templates
 */
/******************************************************************************/
//#region Elements
/* Deprecated loading-banner references kept for existing page code. */
let loadingBannerElem = null;
let loadingBannerMessageFieldElem = null;
let loadingBannerProgressElem = null;
let loadingBannerProgressBarElem = null;
//#endregion

//#region Constants
/* Regular expressions */
const CHARACTER_RE = /^[^a-zA-Z]+$/;
const NUMBER_RE = /^[^0-9]+$/;
const SYMBOL_ALL_RE = /[-+!$%^&*()_|~=`{}\[\]:@#";'<>?,.\/\s]+/;
const SYMBOL_CRITICAL_RE = /[$*|~=\[\]#"'<>?,]+/;
const SYMBOL_CRITICAL_WITH_POINTS_RE = /[$*|~=\[\]:;#"'<>?,\/]+/;
const IP_RE = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
const DATE_RE = /^\d{2}\-\d{2}\-\d{4}$/;
const TIME_RE = /^\d{2}\:\d{2}$/;
const VERSION_RE = /^v([0-9]+)\_([0-9]+)\_([0-9]+)$/;
const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#$^+=!*()@%&]).{8,64}$/;  //To check passwords according to NIST
const EMAIL_RE = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,8})+$/;                   //To check emails
const PHONE_RE = /^\+[1-9][0-9]{6,14}$/;                                            //To check phone numbers, only numbers and +
const PHONE_WITH_SYMBOLS_RE = /^\+[1-9]\d{0,2}\s?(?:\(0\)\s?)?(?:\d[\s-]?){6,14}\d$/;   //To check phone numbers, needs to be sanitized

const MAX_VISIBLE_BANNERS = 3;                                                      //Maximum number of banners to show at once

/* Popup type classes */
const MESSAGE_TYPE_SUCCESS = "success";
const MESSAGE_TYPE_WARNING = "warning";
const MESSAGE_TYPE_ERROR = "error";
const MESSAGE_TYPE_INFO = "info";

/* HTTP codes */
const HTTP_CODE_OK = 200;
const HTTP_CODE_ACCEPTED = 202;
const HTTP_CODE_BAD_REQUEST = 400;
const HTTP_CODE_UNAUTHORIZED = 401;
const HTTP_CODE_CONFLICT = 409;

/* Time delays */
const FETCH_TIME_OUT = 4000;
const SHOW_BANNER_TIME = 5000;
const UPDATE_INTERVAL_PAUSE_TIME = 2000;
const BACK_END_UPDATE_INTERVAL_1M = 60*1000;
const BACK_END_UPDATE_INTERVAL_10S = 10000;
const BACK_END_UPDATE_INTERVAL_5S = 5000;
const BACK_END_UPDATE_INTERVAL_1S = 1000;

const MOBILE_VERSION = screen.width < 700;
const PREFERS_DARK = window.matchMedia("(prefers-color-scheme: dark)").matches;

const LEFT_MOUSE_BUTTON = "click";
const RIGHT_MOUSE_BUTTON = "contextmenu";

const CHOICE_OPTION_CANCEL = 0;
const CHOICE_OPTION1 = 1;
const CHOICE_OPTION2 = 2;

//#region Language and country array
const LANGUAGES = [
    "Afrikaans",
    "Albanian - Shqip",
    "Arabic - العربية",
    "Belarusian - беларуская",
    "Bengali - বাংলা",
    "Bosnian - Bosanski",
    "Bulgarian - български",
    "Chinese - 中文",
    "Croatian - Hrvatski",
    "Czech - čeština",
    "Danish - Dansk",
    "Dutch - Nederlands",
    "English",
    "Esperanto - Esperanto",
    "Estonian - Eesti",
    "Finnish - Suomi",
    "French - Français",
    "German - Deutsch",
    "German (Switzerland) - Deutsch (Schweiz)",
    "Greek - Ελληνικά",
    "Hungarian - Magyar",
    "Icelandic - íslenska",
    "Indonesian - Indonesia",
    "Italian - Italiano",
    "Japanese - 日本語",
    "Korean - 한국어",
    "Latin",
    "Lithuanian - Lietuvių",
    "Macedonian - македонски",
    "Maltese - Malti",
    "Nepali - नेपाली",
    "Norwegian - Norsk",
    "Polish - Polski",
    "Portuguese - Português",
    "Punjabi - ਪੰਜਾਬੀ",
    "Romanian - Română",
    "Russian - Pусский",
    "Slovak - Slovenčina",
    "Slovenian - Slovenščina",
    "Somali - Soomaali",
    "Spanish - Español",
    "Swedish - Svenska",
    "Thai - ไทย",
    "Turkish - Türkçe",
    "Ukrainian - Yкраїнська",
    "Vietnamese - Tiếng Việt",
    "Western Frisian"
];

const LANGUAGE_ABBREVIATIONS = [
    "af",
    "sq",
    "ar",
    "be",
    "bn",
    "bs",
    "bg",
    "zh",
    "hr",
    "cs",
    "da",
    "nl",
    "en",
    "eo",
    "et",
    "fi",
    "fr",
    "de",
    "ds",
    "el",
    "hu",
    "is",
    "id",
    "it",
    "ja",
    "ko",
    "la",
    "lt",
    "mk",
    "mt",
    "ne",
    "no",
    "pl",
    "pt",
    "pa",
    "ro",
    "ru",
    "sk",
    "sl",
    "so",
    "es",
    "sv",
    "th",
    "tr",
    "uk",
    "vi",
    "fy"
];

const COUNTRIES = [
    "Afghanistan - افغانستان",
    "Albania - Shqipëria",
    "Algeria - الجزائر",
    "Argentina",
    "Armenia - Հայաստան",
    "Australia",
    "Austria - Österreich",
    "Azerbaijan - Azərbaycan",
    "Bangladesh - বাংলাদেশ",
    "Belarus - Беларусь",
    "Belgium - België / Belgique",
    "Bosnia and Herzegovina - Bosna i Hercegovina",
    "Brazil - Brasil",
    "Bulgaria - България",
    "Canada",
    "Chile",
    "China - 中国",
    "Colombia",
    "Croatia - Hrvatska",
    "Czech Republic - Česko",
    "Denmark - Danmark",
    "Egypt - مصر",
    "Estonia - Eesti",
    "Finland - Suomi",
    "France - France",
    "Georgia - საქართველო",
    "Germany - Deutschland",
    "Greece - Ελλάδα",
    "Hungary - Magyarország",
    "Iceland - Ísland",
    "India - भारत",
    "Indonesia - Indonesia",
    "Iran - ایران",
    "Iraq - العراق",
    "Ireland - Éire",
    "Israel - ישראל",
    "Italy - Italia",
    "Japan - 日本",
    "Jordan - الأردن",
    "Kazakhstan - Қазақстан",
    "Kenya",
    "South Korea - 대한민국",
    "Latvia - Latvija",
    "Lithuania - Lietuva",
    "Luxembourg - Lëtzebuerg",
    "Malaysia",
    "Mexico - México",
    "Morocco - المغرب",
    "Netherlands - Nederland",
    "New Zealand",
    "Nigeria",
    "North Macedonia - Северна Македонија",
    "Norway - Norge",
    "Pakistan - پاکستان",
    "Peru",
    "Philippines",
    "Poland - Polska",
    "Portugal - Portugal",
    "Romania - România",
    "Russia - Россия",
    "Saudi Arabia - السعودية",
    "Serbia - Србија",
    "Singapore",
    "Slovakia - Slovensko",
    "Slovenia - Slovenija",
    "South Africa",
    "Spain - España",
    "Sweden - Sverige",
    "Switzerland - Schweiz / Suisse / Svizzera",
    "Thailand - ประเทศไทย",
    "Turkey - Türkiye",
    "Ukraine - Україна",
    "United Arab Emirates - الإمارات العربية المتحدة",
    "United Kingdom",
    "United States",
    "Vietnam - Việt Nam"
];
//#endregion
//#endregion

//#region Variables
let openModals = [];
//#endregion
