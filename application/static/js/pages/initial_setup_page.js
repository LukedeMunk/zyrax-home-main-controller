/****************************************************************************/
/*
 * File:    initial_setup_page.js
 * Author:  Luke de Munk
 * Version: 0.10.0
 *
 * Brief:   Page controller for initial setup.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/****************************************************************************/

import {
    API_URL_ADD_ACCOUNT, API_URL_ADD_PROFILE, API_URL_GET_PROFILE_PICTURE
} from "../domain/endpoints.js";
import {
    TEXT_FIELD_NO_SYMBOLS, TEXT_FIELD_REQUIRED, TEXT_FIELD_UNIQUE, TEXT_INVALID_EMAIL,
    TEXT_PASSWORDS_DONT_MATCH, TEXT_PASSWORD_NOT_STRONG
} from "../domain/language_pack_english.js";
import { mountModuleSettings } from "../ui_components/module_settings.js";
import { mountPage, profileStorage, readPageData } from "../core/page.js";
import { scrollToSection } from "../core/scroll.js";
import { submitForm } from "../services/forms.js";
import { uploadProfilePicture } from "../services/profiles.js";
import { EMAIL_RE, PASSWORD_RE, SYMBOL_CRITICAL_RE } from "../domain/validation.js";

const { http, banners, signal, delay } = mountPage("setup");
const { languages } = readPageData();
const userProfiles = [];
let weatherServiceEnabled, telegramServiceEnabled, weatherApiKey, telegramBotToken;

//#region Elements
const welcomeTitleElem = document.getElementById("welcomeTitle");
const profileUiThemeSelectElem = null; //Not on first setup, keep things simple
const accountEmailTxtElem = document.getElementById("accountEmailTxt");
const accountPasswordTxtElem = document.getElementById("accountPasswordTxt");
const accountRetypePasswordTxtElem = document.getElementById("accountRetypePasswordTxt");

const profilePictureUploadElem = document.getElementById("profilePictureUpload");
const profileNameTxtElem = document.getElementById("profileNameTxt");
const profileLanguageSelectElem = document.getElementById("profileLanguageSelect");

const weatherApiKeyTxtElem = document.getElementById("weatherApiKeyTxt");

const telegramBotTokenTxtElem = document.getElementById("telegramBotTokenTxt");

const passwordValidationContainerElem = document.getElementById("passwordValidationContainer");
const accountCurrentPasswordTxtElem = document.getElementById("accountCurrentPasswordTxt");
//
const errorMessageAccountFieldElem = document.getElementById("errorMessageAccountField");
const errorMessageProfileFieldElem = document.getElementById("errorMessageProfileField");
const profilePicturePreviewElem = document.getElementById("profilePicturePreview");
const passwordValidationIconLengthElem = document.getElementById("passwordValidationIconLength");
const passwordValidationIconUpperCaseElem =
    document.getElementById("passwordValidationIconUpperCase");
const passwordValidationIconLowerCaseElem =
    document.getElementById("passwordValidationIconLowerCase");
const passwordValidationIconNumberElem = document.getElementById("passwordValidationIconNumber");
const passwordValidationIconSymbolElem = document.getElementById("passwordValidationIconSymbol");
//#endregion
//#region Constants
const WELCOME_TEXTS = ["Welcome to ZyraX Home", //English
"Welkom bij ZyraX Home",            //Dutch
"Bienvenue à ZyraX Home",           //French
"Bienvenido a ZyraX Home",          //Spanish
"ようこそ ZyraX Home へ",           //Japanese
"欢迎来到 ZyraX Home",              //Simplified Chinese
"Добро пожаловать в ZyraX Home",    //Russian
"Benvenuto in ZyraX Home",          //Italian
"Bem-vindo ao ZyraX Home",          //Portuguese (Brazil)
"Willkommen bei ZyraX Home",        //German
"Witamy w ZyraX Home",              //Polish
"Välkommen till ZyraX Home",        //Swedish
"Tervetuloa ZyraX Homeen",          //Finnish
"Selamat datang di ZyraX Home",     //Indonesian / Malay
"Chào mừng bạn đến với ZyraX Home", //Vietnamese
"स्वागत है ZyraX Home में",              //Hindi
"مرحبا بك في ZyraX Home",           //Arabic
"ברוך הבא ל־ZyraX Home",            //Hebrew
"Καλώς ήρθατε στο ZyraX Home",      //Greek
"Velkommen til ZyraX Home",         //Danish / Norwegian
"ZyraX Home에 오신 것을 환영합니다", //Korean
"ZyraX Home'a hoş geldiniz",        //Turkish
"Üdvözöljük a ZyraX Home-ban",      //Hungarian
"Dobrodošli u ZyraX Home",          //Croatian / Serbian
"Vitajte v ZyraX Home",             //Slovak
"Laipni lūdzam ZyraX Home",         //Latvian
"Sveiki atvykę į ZyraX Home",       //Lithuanian
"Bine ați venit la ZyraX Home",     //Romanian
"Dobrodošli v ZyraX Home"           //Slovenian
];
//#endregion

//#region Variables
let languageIndex = 0;          //For welcome texts
let selectedProfilePictureFile = null;
//#endregion


mountModuleSettings(document, { http, signal, banners }, {});

/* Account flow */
if (accountEmailTxtElem != null) {
    /****************************************************************************/
    /*!
     * @brief   Advances from the email field to the next credential field on Enter.
     * @param   e                       Event reported by the bound control.
     */
    /****************************************************************************/
    accountEmailTxtElem.addEventListener("keyup", function (e) {
        if (e.code === "Enter") {
            if (accountCurrentPasswordTxtElem != null) {
                accountCurrentPasswordTxtElem.focus();
            } else {
                accountPasswordTxtElem.focus();
            }
        }
    }, { signal });

    if (accountCurrentPasswordTxtElem != null) {
        /****************************************************************************/
        /*!
         * @brief   Moves focus to the new password field when Enter is pressed.
         * @param   e                       Event reported by the bound control.
         */
        /****************************************************************************/
        accountCurrentPasswordTxtElem.addEventListener("keyup", function (e) {
            if (e.code === "Enter") {
                accountPasswordTxtElem.focus();
            }
        }, { signal });
    }

    /****************************************************************************/
    /*!
     * @brief   Updates password requirements and advances to confirmation on Enter.
     * @param   e                       Event reported by the bound control.
     */
    /****************************************************************************/
    accountPasswordTxtElem.addEventListener("keyup", function (e) {
        passwordValidationContainerElem.classList.add("show");
        updatePasswordValidationIcons();

        if (e.code === "Enter") {
            accountRetypePasswordTxtElem.focus();
        }
    }, { signal });

    /****************************************************************************/
    /*!
     * @brief   Submits account creation when Enter is pressed in confirmation.
     * @param   e                       Event reported by the bound control.
     */
    /****************************************************************************/
    accountRetypePasswordTxtElem.addEventListener("keyup", function (e) {
        if (e.code === "Enter") {
            createAccount();
        }
    });

    /* Profile flow */
    /****************************************************************************/
    /*!
     * @brief   Loads the selected picture for the initial profile preview.
     * @param   event                   Event reported by the bound control.
     */
    /****************************************************************************/
    profilePictureUploadElem.addEventListener("change", event => {
        selectedProfilePictureFile = event.target.files[0];

        if (selectedProfilePictureFile) {
            const reader = new FileReader();

            /****************************************************************************/
            /*!
             * @brief   Applies a successfully loaded response or file preview.
             * @param   e                       Event reported by the bound control.
             */
            /****************************************************************************/
            reader.onload = e => {
                profilePicturePreviewElem.src = e.target.result;
            };
            reader.readAsDataURL(selectedProfilePictureFile);
            profileNameTxtElem.focus();
        }
    }, { signal });

    /****************************************************************************/
    /*!
     * @brief   Moves focus to profile language selection when Enter is pressed.
     * @param   e                       Event reported by the bound control.
     */
    /****************************************************************************/
    profileNameTxtElem.addEventListener("keyup", function (e) {
        if (e.code === "Enter") {
            profileLanguageSelectElem.focus();
        }
    }, { signal });
}

if (weatherApiKeyTxtElem != null) {
    /* Module flow */
    /****************************************************************************/
    /*!
     * @brief   Moves focus to the Telegram token when Enter is pressed.
     * @param   e                       Event reported by the bound control.
     */
    /****************************************************************************/
    weatherApiKeyTxtElem.addEventListener("keydown", function (e) {
        if (e.code === "Enter") {
            telegramBotTokenTxtElem.focus();
        }
    }, { signal });

    /****************************************************************************/
    /*!
     * @brief   Keeps the Telegram Enter-key hook available during initial setup.
     * @param   e                       Event reported by the bound control.
     */
    /****************************************************************************/
    telegramBotTokenTxtElem.addEventListener("keydown", function (e) {
        if (e.code === "Enter") {}
    }, { signal });
}

/****************************************************************************/
/*!
 * @brief   When page finished loading, this function is executed.
 */
/****************************************************************************/
document.querySelector('[data-action="scrollToSection"]').addEventListener("click", () =>
    scrollToSection('accountContainer', signal), { signal });
document.querySelector('[data-action="createAccount"]').addEventListener("click", () =>
    createAccount(), { signal });
document.querySelector('[data-action="createProfile"]').addEventListener("click", () =>
    createProfile(), { signal });
document.querySelector('[data-action="finishSetup"]').addEventListener("click", () =>
    location.assign('/configuration?show_welcome_message'), { signal });

initialize();

/****************************************************************************/
/*!
 * @brief   Loads page text, initial state and page-specific controls.
 */
/****************************************************************************/
function initialize() {
    profilePicturePreviewElem.src = API_URL_GET_PROFILE_PICTURE + "?default=1";
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    rotateText();

    const rotation = setInterval(rotateText, 8000);

    signal.addEventListener("abort", () => clearInterval(rotation), { once: true });

    for (const language of languages) {
        profileLanguageSelectElem.add(new Option(language.language, language.id));
    }
}

/****************************************************************************/
/*!
 * @brief   Adds an account to the system.
 */
/****************************************************************************/
async function createAccount() {
    let data = validateAccount();
    if (!data) {
        return;
    }

    try {
        await submitForm(http, API_URL_ADD_ACCOUNT, data, signal);
    } catch (error) {
        if (signal.aborted) return;

        errorMessageAccountFieldElem.style.display = "inline-block";
        errorMessageAccountFieldElem.textContent = error.message;

        return;
    }

    scrollToSection("profileContainer", signal);
}

/****************************************************************************/
/*!
 * @brief   Adds a profile to the account.
 */
/****************************************************************************/
async function createProfile() {
    let data = validateProfile();
    if (!data) {
        return;
    }

    let result;

    try {
        result = await submitForm(http, API_URL_ADD_PROFILE, data, signal);
    } catch (error) {
        if (signal.aborted) return;

        errorMessageProfileFieldElem.style.display = "inline-block";
        errorMessageProfileFieldElem.textContent = error.message;

        return;
    }

    data.id = result.id;

    /* Upload profile picture */
    if (selectedProfilePictureFile) {
        try {
            await uploadProfilePicture(data.id, selectedProfilePictureFile, signal);
        } catch (error) {
            errorMessageProfileFieldElem.textContent = error.message;
            errorMessageProfileFieldElem.style.display = "inline-block";
        }
    }

    profileStorage().setItem("profileId", data.id);
    userProfiles.push(data);
    scrollToSection("moduleConfigurationContainer", signal);
}

/****************************************************************************/
/*!
 * @brief   Rotates the welcome title.
 */
/****************************************************************************/
function rotateText() {
    welcomeTitleElem.style.opacity = 0;

    /****************************************************************************/
    /*!
     * @brief   Shows the next translated welcome message in the setup animation.
     */
    /****************************************************************************/
    delay(() => {
        welcomeTitleElem.textContent = WELCOME_TEXTS[languageIndex];
        welcomeTitleElem.style.opacity = 1;

        languageIndex = (languageIndex + 1) % WELCOME_TEXTS.length;
    }, 1000);
}

/****************************************************************************/
/*!
 * @brief   Updates the password validation icons based on input.
 */
/****************************************************************************/
function updatePasswordValidationIcons() {
    const SYMBOL_RE = /[-\+!$%^&*()_|~=:@#;<>?,.\/\\]+/;
    const DIGIT_RE = /[0-9]+/;
    const UPPERCASE_RE = /[A-Z]+/;
    const LOWERCASE_RE = /[a-z]+/;

    let password = accountPasswordTxtElem.value;

    if (password.length < 8 || password.length > 64) {
        passwordValidationIconLengthElem.className = "fa-solid fa-circle-xmark";
        passwordValidationIconLengthElem.style.color = "var(--warning-text)";
    } else {
        passwordValidationIconLengthElem.className = "fa-solid fa-circle-check";
        passwordValidationIconLengthElem.style.color = "var(--success-text)";
    }

    if (!password.match(UPPERCASE_RE)) {
        passwordValidationIconUpperCaseElem.className = "fa-solid fa-circle-xmark";
        passwordValidationIconUpperCaseElem.style.color = "var(--warning-text)";
    } else {
        passwordValidationIconUpperCaseElem.className = "fa-solid fa-circle-check";
        passwordValidationIconUpperCaseElem.style.color = "var(--success-text)";
    }

    if (!password.match(LOWERCASE_RE)) {
        passwordValidationIconLowerCaseElem.className = "fa-solid fa-circle-xmark";
        passwordValidationIconLowerCaseElem.style.color = "var(--warning-text)";
    } else {
        passwordValidationIconLowerCaseElem.className = "fa-solid fa-circle-check";
        passwordValidationIconLowerCaseElem.style.color = "var(--success-text)";
    }

    if (!password.match(DIGIT_RE)) {
        passwordValidationIconNumberElem.className = "fa-solid fa-circle-xmark";
        passwordValidationIconNumberElem.style.color = "var(--warning-text)";
    } else {
        passwordValidationIconNumberElem.className = "fa-solid fa-circle-check";
        passwordValidationIconNumberElem.style.color = "var(--success-text)";
    }

    if (!password.match(SYMBOL_RE)) {
        passwordValidationIconSymbolElem.className = "fa-solid fa-circle-xmark";
        passwordValidationIconSymbolElem.style.color = "var(--warning-text)";
    } else {
        passwordValidationIconSymbolElem.className = "fa-solid fa-circle-check";
        passwordValidationIconSymbolElem.style.color = "var(--success-text)";
    }
}

/****************************************************************************/
/*!
 * @brief   Validates account credentials and optionally only the password fields.
 * @param   onlyPassword            Whether to validate only password fields.
 * @returns Whether the entered values are valid.
 */
/****************************************************************************/
function validateAccount(onlyPassword = false) {
    /* Get user input */
    let email = accountEmailTxtElem.value;
    let password = accountPasswordTxtElem.value;
    let retypedPassword = accountRetypePasswordTxtElem.value;

    /* Reset error styling */
    errorMessageAccountFieldElem.style.display = "none";

    accountEmailTxtElem.classList.remove("invalid-input");
    accountPasswordTxtElem.classList.remove("invalid-input");
    accountRetypePasswordTxtElem.classList.remove("invalid-input");

    if (!onlyPassword) {
        /* Validate name */
        if (email == "") {
            accountEmailTxtElem.classList.add("invalid-input");
            accountEmailTxtElem.focus();
            errorMessageAccountFieldElem.textContent = TEXT_FIELD_REQUIRED;
            errorMessageAccountFieldElem.style.display = "inline-block";

            return false;
        }
        if (!email.match(EMAIL_RE)) {
            accountEmailTxtElem.classList.add("invalid-input");
            accountEmailTxtElem.focus();
            errorMessageAccountFieldElem.textContent = TEXT_INVALID_EMAIL;
            errorMessageAccountFieldElem.style.display = "inline-block";

            return false;
        }
    }

    /* Validate password */
    if (password == "") {
        accountPasswordTxtElem.classList.add("invalid-input");
        accountPasswordTxtElem.focus();
        errorMessageAccountFieldElem.textContent = TEXT_FIELD_REQUIRED;
        errorMessageAccountFieldElem.style.display = "inline-block";

        return false;
    }

    if (!password.match(PASSWORD_RE)) {
        accountPasswordTxtElem.classList.add("invalid-input");
        accountPasswordTxtElem.focus();
        errorMessageAccountFieldElem.textContent = TEXT_PASSWORD_NOT_STRONG;
        errorMessageAccountFieldElem.style.display = "inline-block";

        return false;
    }

    /* Check whether passwords match */
    if (password != retypedPassword) {
        accountPasswordTxtElem.classList.add("invalid-input");
        accountRetypePasswordTxtElem.classList.add("invalid-input");
        accountPasswordTxtElem.focus();
        errorMessageAccountFieldElem.textContent = TEXT_PASSWORDS_DONT_MATCH;
        errorMessageAccountFieldElem.style.display = "inline-block";

        return false;
    }

    if (onlyPassword) {
        return true;
    }

    let data = { email: email, password: password };

    return data;
}

/****************************************************************************/
/*!
 * @brief   Validates the profile name and its uniqueness before saving.
 * @param   id                      Identifier of the affected item.
 * @returns Whether the entered values are valid.
 */
/****************************************************************************/
function validateProfile(id = -1) {
    /* Get user input */
    let name = profileNameTxtElem.value;
    let language = profileLanguageSelectElem.value;
    let uiTheme = undefined;

    if (profileUiThemeSelectElem != null) {
        uiTheme = profileUiThemeSelectElem.value;
    }

    /* Reset error styling */
    errorMessageProfileFieldElem.style.display = "none";

    profileNameTxtElem.classList.remove("invalid-input");

    /* Validate name */
    if (name == "") {
        profileNameTxtElem.classList.add("invalid-input");
        profileNameTxtElem.focus();
        errorMessageProfileFieldElem.textContent = TEXT_FIELD_REQUIRED;
        errorMessageProfileFieldElem.style.display = "inline-block";

        return false;
    }
    if (name.match(SYMBOL_CRITICAL_RE)) {
        profileNameTxtElem.classList.add("invalid-input");
        profileNameTxtElem.focus();
        errorMessageProfileFieldElem.textContent = TEXT_FIELD_NO_SYMBOLS;
        errorMessageProfileFieldElem.style.display = "inline-block";

        return false;
    }

    for (let profile of userProfiles) {
        if (profile.id == id) {
            continue;
        }

        /* Check if name is unique */
        if (profile.name == name) {
            profileNameTxtElem.classList.add("invalid-input");
            profileNameTxtElem.focus();
            errorMessageProfileFieldElem.textContent = TEXT_FIELD_UNIQUE;
            errorMessageProfileFieldElem.style.display = "inline-block";

            return false;
        }
    }

    let data = { id: id, name: name, language: language };

    if (id != -1 && uiTheme != undefined) {
        data.ui_theme = uiTheme;
    }

    return data;
}
