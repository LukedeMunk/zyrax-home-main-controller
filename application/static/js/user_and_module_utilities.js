/******************************************************************************/
/*
 * File:    user_and_module_utilities.js
 * Author:  Luke de Munk
 * Version: 0.9.0
 * 
 * Brief:   JavaScript for account and profile utilities and module utilities.
 *
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/
//#region Elements
/* Text elements */
const accountEmailTitleElem = document.getElementById("accountEmailTitle");
const accountCurrentPasswordTxtElem = document.getElementById("accountCurrentPasswordTxt");
const accountPasswordTitleElem = document.getElementById("accountPasswordTitle");
const accountRetypePasswordTitleElem = document.getElementById("accountRetypePasswordTitle");

const profileModalTitleElem = document.getElementById("profileModalTitle");
const profileNameTitleElem = document.getElementById("profileNameTitle");
const profileLanguageTitleElem = document.getElementById("profileLanguageTitle");

const modulesTitleElem = document.getElementById("modulesTitle");
const weatherIntegrationTitleElem = document.getElementById("weatherIntegrationTitle");
const weatherApiKeyTitleElem = document.getElementById("weatherApiKeyTitle");
const telegramIntegrationTitleElem = document.getElementById("telegramIntegrationTitle");
const telegramBotTokenTitleElem = document.getElementById("telegramBotTokenTitle");
const rpiRfModuleTitleElem = document.getElementById("rpiRfModuleTitle");

/* Fields */
const errorMessageModuleConfigurationFieldElem = document.getElementById("errorMessageModuleConfigurationField");//

const errorMessageAccountFieldElem = document.getElementById("errorMessageAccountField");
const errorMessageProfileFieldElem = document.getElementById("errorMessageProfileField");
const profilePicturePreviewElem = document.getElementById("profilePicturePreview");
const pwdValidationIconLengthElem = document.getElementById("pwdValidationIconLength");
const pwdValidationIconUpperCaseElem = document.getElementById("pwdValidationIconUpperCase");
const pwdValidationIconLowerCaseElem = document.getElementById("pwdValidationIconLowerCase");
const pwdValidationIconNumberElem = document.getElementById("pwdValidationIconNumber");
const pwdValidationIconSymbolElem = document.getElementById("pwdValidationIconSymbol");

/* Buttons */

/* Icons */

/* Input elements */
const accountEmailTxtElem = document.getElementById("accountEmailTxt");
const accountPasswordTxtElem = document.getElementById("accountPasswordTxt");
const accountRetypePasswordTxtElem = document.getElementById("accountRetypePasswordTxt");

const profilePictureUploadElem = document.getElementById("profilePictureUpload");
const profileNameTxtElem = document.getElementById("profileNameTxt");
const profileLanguageSelectElem = document.getElementById("profileLanguageSelect");

const weatherServiceEnabledCbElem = document.getElementById("weatherServiceEnabledCb");
const weatherApiKeyTxtElem = document.getElementById("weatherApiKeyTxt");
const telegramServiceEnabledCbElem = document.getElementById("telegramServiceEnabledCb");
const telegramBotTokenTxtElem = document.getElementById("telegramBotTokenTxt");
const rpiRfModuleEnabledCbElem = document.getElementById("rpiRfModuleEnabledCb");

/* Tables */

/* Modals */

/* Other */
const passwordValidationContainerElem = document.getElementById("passwordValidationContainer");
//#endregion

//#region Constants
//#endregion

//#region Variables
let lastAccountData;
let lastProfileData;
let selectedProfilePictureFile = null;
//#endregion

//#region Event listeners
/* Account flow */
if (accountEmailTxtElem != null) {
    accountEmailTxtElem.addEventListener("keyup", function (e) {
        if (e.code === "Enter") {
            if (accountCurrentPasswordTxtElem != null) {
                accountCurrentPasswordTxtElem.focus();
            } else {
                accountPasswordTxtElem.focus();
            }
        }
    });
    
    if (accountCurrentPasswordTxtElem != null) {
        accountCurrentPasswordTxtElem.addEventListener("keyup", function (e) {
            if (e.code === "Enter") {
                accountPasswordTxtElem.focus();
            }
        });
    }

    accountPasswordTxtElem.addEventListener("keyup", function (e) {
        passwordValidationContainerElem.classList.add("show");
        updatePasswordValidationIcons();

        if (e.code === "Enter") {
            accountRetypePasswordTxtElem.focus();
        }
    });
    accountRetypePasswordTxtElem.addEventListener("keyup", function (e) {
        if (e.code === "Enter") {
            if (page == INITIAL_SETUP_PAGE) {
                createAccount();
            } else {
                updatePassword();
            }
        }
    });

    /* Profile flow */
    profilePictureUploadElem.addEventListener("change", (event) => {
        selectedProfilePictureFile = event.target.files[0];
        if (selectedProfilePictureFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                profilePicturePreviewElem.src = e.target.result;
            };
            reader.readAsDataURL(selectedProfilePictureFile);
            profileNameTxtElem.focus();
        }
    });
    profileNameTxtElem.addEventListener("keyup", function (e) {
        if (e.code === "Enter") {
            profileLanguageSelectElem.focus();
        }
    });
}

if (weatherApiKeyTxtElem != null) {
    /* Module flow */
    weatherApiKeyTxtElem.addEventListener("keydown", function (e) {
        if (e.code === "Enter") {
            telegramBotTokenTxtElem.focus();
        }
    });
    telegramBotTokenTxtElem.addEventListener("keydown", function (e) {
        if (e.code === "Enter") {
            
        }
    });
}
//#endregion

/******************************************************************************/
/*!
  @brief    When page finished loading, this function is executed.
*/
/******************************************************************************/
$(document).ready(function() {

});

//#region Togglers and submitters
/******************************************************************************/
/*!
  @brief    Toggles the weather service state.
*/
/******************************************************************************/
function toggleWeatherServiceEnabled() {
    if (!weatherServiceEnabledCbElem.checked) {
        weatherApiKeyTxtElem.disabled = true;
        weatherApiKeyTxtElem.classList.add("disabled");
        return;
    }

    weatherApiKeyTxtElem.disabled = false;
    weatherApiKeyTxtElem.classList.remove("disabled");

    if (weatherApiKeyTxtElem.value != "") {
        submitWeatherModuleConfiguration();
    }
}
/******************************************************************************/
/*!
  @brief    Toggles the Telegram service state.
*/
/******************************************************************************/
function toggleTelegramServiceEnabled() {
    if (!telegramServiceEnabledCbElem.checked) {
        telegramBotTokenTxtElem.disabled = true;
        telegramBotTokenTxtElem.classList.add("disabled");
        return;
    }

    telegramBotTokenTxtElem.disabled = false;
    telegramBotTokenTxtElem.classList.remove("disabled");

    if (telegramBotTokenTxtElem.value != "") {
        submitTelegramModuleConfiguration();
    }
}

/******************************************************************************/
/*!
  @brief    Submits the weather module configuration when valid.
*/
/******************************************************************************/
function submitWeatherModuleConfiguration() {
    if (!validateWeatherModuleConfiguration()) {
        return;
    }

    let data = {
        weather_service_enabled: +weatherServiceEnabled,
        weather_api_key: weatherApiKey
    }

    let result = httpPostRequestJsonReturn("/update_weather_configuration", data);
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageModuleConfigurationFieldElem.style.display = "inline-block";
        errorMessageModuleConfigurationFieldElem.textContent = result.message;
        return;
    }
    
    showBanner(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
}

/******************************************************************************/
/*!
  @brief    Submits the Telegram module configuration when valid.
*/
/******************************************************************************/
function submitTelegramModuleConfiguration() {
    if (!validateTelegramModuleConfiguration()) {
        return;
    }

    let data = {
        telegram_service_enabled: +telegramServiceEnabled,
        telegram_bot_token: telegramBotToken
    }

    let result = httpPostRequestJsonReturn("/update_telegram_configuration", data);
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageModuleConfigurationFieldElem.style.display = "inline-block";
        errorMessageModuleConfigurationFieldElem.textContent = result.message;
        return;
    }
    
    showBanner(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
}

/******************************************************************************/
/*!
  @brief    Enables or disables the Raspberry Pi RF receiver.
*/
/******************************************************************************/
function submitRpiRfModuleEnabled() {
    rpiRfReceiverEnabled = rpiRfModuleEnabledCbElem.checked;

    let data = {
        rpi_rf_receiver_enabled: +rpiRfReceiverEnabled
    }

    let result = httpPostRequestJsonReturn("/update_rpi_rf_module", data);
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageModuleConfigurationFieldElem.style.display = "inline-block";
        errorMessageModuleConfigurationFieldElem.textContent = result.message;
        
        rpiRfReceiverEnabled = false;
        rpiRfModuleEnabledCbElem.checked = rpiRfReceiverEnabled;
        return;
    }
    
    showBanner(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
}
//#endregion

//#region Validators
/******************************************************************************/
/*!
  @brief    Validates the account input.
  @param    onlyPassword        When true, only the password is checked
  @returns  bool                True if valid
*/
/******************************************************************************/
function validateAccount(onlyPassword=false) {
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

    lastAccountData = {
        //id : id
    }

    lastAccountData.email = email;
    lastAccountData.password = password;

    return true;
}

/******************************************************************************/
/*!
  @brief    Validates the profile input.
  @param    id                  Profile ID
  @returns  bool                True if valid
*/
/******************************************************************************/
function validateProfile(id=-1) {
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

    lastProfileData = {
        id : id
    }

    if (id != -1) {
        lastProfileData.name = name;
        lastProfileData.language = language;
        if (uiTheme != undefined) {
            lastProfileData.ui_theme = uiTheme;
        }
    } else {
        lastProfileData.name = name;
        lastProfileData.language = language;
    }

    return true;
}

/******************************************************************************/
/*!
  @brief    Updates the password validation icons based on input.
*/
/******************************************************************************/
function updatePasswordValidationIcons() {
    const SYMBOL_RE = /[-\+!$%^&*()_|~=:@#;<>?,.\/\\]+/;
    const DIGIT_RE = /[0-9]+/;
    const UPPERCASE_RE = /[A-Z]+/;
    const LOWERCASE_RE = /[a-z]+/;

    var password = accountPasswordTxtElem.value;

    if (password.length < 8 || password.length > 64) {
        pwdValidationIconLengthElem.className = "fa-solid fa-circle-xmark";
        pwdValidationIconLengthElem.style.color = "var(--warning-text)";
    } else {
        pwdValidationIconLengthElem.className = "fa-solid fa-circle-check";
        pwdValidationIconLengthElem.style.color = "var(--success-text)";
    }

    if (!password.match(UPPERCASE_RE)) {
        pwdValidationIconUpperCaseElem.className = "fa-solid fa-circle-xmark";
        pwdValidationIconUpperCaseElem.style.color = "var(--warning-text)";
    } else {
        pwdValidationIconUpperCaseElem.className = "fa-solid fa-circle-check";
        pwdValidationIconUpperCaseElem.style.color = "var(--success-text)";
    }
    
    if (!password.match(LOWERCASE_RE)) {
        pwdValidationIconLowerCaseElem.className = "fa-solid fa-circle-xmark";
        pwdValidationIconLowerCaseElem.style.color = "var(--warning-text)";
    } else {
        pwdValidationIconLowerCaseElem.className = "fa-solid fa-circle-check";
        pwdValidationIconLowerCaseElem.style.color = "var(--success-text)";
    }
    
    if (!password.match(DIGIT_RE)) {
        pwdValidationIconNumberElem.className = "fa-solid fa-circle-xmark";
        pwdValidationIconNumberElem.style.color = "var(--warning-text)";
    } else {
        pwdValidationIconNumberElem.className = "fa-solid fa-circle-check";
        pwdValidationIconNumberElem.style.color = "var(--success-text)";
    }
    
    if (!password.match(SYMBOL_RE)) {
        pwdValidationIconSymbolElem.className = "fa-solid fa-circle-xmark";
        pwdValidationIconSymbolElem.style.color = "var(--warning-text)";
    } else {
        pwdValidationIconSymbolElem.className = "fa-solid fa-circle-check";
        pwdValidationIconSymbolElem.style.color = "var(--success-text)";
    }
}
/******************************************************************************/
/*!
  @brief    Validates the weather module configuration.
  @returns  bool                True if valid
*/
/******************************************************************************/
function validateWeatherModuleConfiguration() {
    /* Get user input */
    let weatherServiceEnabledInput = weatherServiceEnabledCbElem.checked;
    let weatherApiKeyInput = weatherApiKeyTxtElem.value;

    /* Reset error styling */
    errorMessageModuleConfigurationFieldElem.style.display = "none";
    weatherApiKeyTxtElem.classList.remove("invalid-input");

    /* No API key check when disabled */
    if (!weatherServiceEnabledInput) {
        weatherServiceEnabled = weatherServiceEnabledInput;
        weatherApiKey = weatherApiKeyInput;
        return true;
    }

    /* Validate API key */
    if (weatherApiKeyInput.length != 25) {
        weatherApiKeyTxtElem.classList.add("invalid-input");
        weatherApiKeyTxtElem.focus();
        errorMessageModuleConfigurationFieldElem.textContent = TEXT_KEY_NOT_VALID;
        errorMessageModuleConfigurationFieldElem.style.display = "inline-block";
        return false;
    }
    
    weatherServiceEnabled = weatherServiceEnabledInput;
    weatherApiKey = weatherApiKeyInput;

    return true;
}

/******************************************************************************/
/*!
  @brief    Validates the Telegram configuration.
  @returns  bool                True if valid
*/
/******************************************************************************/
function validateTelegramModuleConfiguration() {
    /* Get user input */
    let telegramServiceEnabledInput = telegramServiceEnabledCbElem.checked;
    let telegramBotTokenInput = telegramBotTokenTxtElem.value;

    /* Reset error styling */
    errorMessageModuleConfigurationFieldElem.style.display = "none";
    telegramBotTokenTxtElem.classList.remove("invalid-input");

    /* No bot token check when disabled */
    if (!telegramServiceEnabledInput) {
        telegramServiceEnabled = telegramServiceEnabledInput;
        telegramBotToken = telegramBotTokenInput;
        return true;
    }

    /* Validate Telegram bot token */
    if (telegramBotTokenInput.length != 46) {
        telegramBotTokenTxtElem.classList.add("invalid-input");
        telegramBotTokenTxtElem.focus();
        errorMessageModuleConfigurationFieldElem.textContent = TEXT_KEY_NOT_VALID;
        errorMessageModuleConfigurationFieldElem.style.display = "inline-block";
        telegramServiceEnabledCbElem.checked = false;
        return false;
    }
    
    telegramServiceEnabled = telegramServiceEnabledInput;
    telegramBotToken = telegramBotTokenInput;

    return true;
}
//#endregion

//#region Utilities
/******************************************************************************/
/*!
  @brief    Loads the UI language select options.
*/
/******************************************************************************/
function loadLanguageSelectOptions() {
    profileLanguageSelectElem.innerHTML = "";
    
    for (let language of SUPPORTED_UI_LANGUAGES) {
        option = document.createElement("option");
        option.value = language.id;
        option.text = language.language;
        
        profileLanguageSelectElem.appendChild(option);
    }
}

/******************************************************************************/
/*!
  @brief    Loads the profiles into the select container.
  @param    profiles            Profiles to load
  @param    generateAddProfileTile  If true, add profile container is added
  @param    onclickFunction     Function to execute on click
*/
/******************************************************************************/
function loadProfiles(profiles, generateAddProfileTile=false, onclickFunction="changeProfile", highlightProfileId=undefined) {
    profileSelectContainerElem.innerHTML = "";

    for (let profile of profiles) {
        /* Container */
        let container = document.createElement("div");
        container.className = "profile-picture-upload";

        /* Label */
        let label = document.createElement("label");
        label.className = "profile-picture-upload-button";
        
        if (profile.id == highlightProfileId) {
            label.classList.add("selected");
        }

        /* Image */
        let image = document.createElement("img");
        image.id = "profilePicturePreview" + profile.id;
        image.src = "/get_profile_picture?id=" + profile.id + "&t=" + new Date().getTime();
        image.setAttribute("onclick", onclickFunction + "(" + profile.id + ");")

        label.appendChild(image);

        /* Subtitle */
        let subtitle = document.createElement("p");
        subtitle.style.fontWeight = "bold";
        subtitle.textContent = profile.name;

        container.appendChild(label);
        container.appendChild(subtitle);

        profileSelectContainerElem.appendChild(container);
    }

    if (generateAddProfileTile) {
        /* Container */
        let container = document.createElement("div");
        container.className = "profile-picture-upload";

        /* Label */
        let label = document.createElement("label");
        label.className = "profile-picture-upload-button";

        /* Image */
        let image = document.createElement("img");
        image.id = "profilePicturePreview";
        image.src = "/get_default_profile_picture";
        image.setAttribute("onclick", "loadProfile(-1);")

        label.appendChild(image);

        /* Subtitle */
        let subtitle = document.createElement("p");
        subtitle.style.fontWeight = "bold";
        subtitle.textContent = TEXT_ADD_PROFILE;

        container.appendChild(label);
        container.appendChild(subtitle);

        profileSelectContainerElem.appendChild(container);
    }
}
//#endregion