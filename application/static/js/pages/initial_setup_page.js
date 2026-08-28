/******************************************************************************/
/*
 * File:    initial_setup_page.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   JavaScript for the initial setup page. More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/
//#region Elements
/* Text elements */
const welcomeTitleElem = document.getElementById("welcomeTitle");

/* Fields */

/* Buttons */
const nextBtnElem = document.getElementById("nextBtn");

/* Icons */

/* Input elements */
const profileUiThemeSelectElem = null;                                              //Not on first setup, keep things simple

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
const passwordValidationContainerElem = document.getElementById("passwordValidationContainer");
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
const passwordValidationIconLengthElem = document.getElementById("passwordValidationIconLength");
const passwordValidationIconUpperCaseElem = document.getElementById("passwordValidationIconUpperCase");
const passwordValidationIconLowerCaseElem = document.getElementById("passwordValidationIconLowerCase");
const passwordValidationIconNumberElem = document.getElementById("passwordValidationIconNumber");
const passwordValidationIconSymbolElem = document.getElementById("passwordValidationIconSymbol");

/* Tables */

/* Modals */

/* Other */
const welcomeContainerElem = document.getElementById("welcomeContainer");
//#endregion

//#region Constants
const WELCOME_TEXTS = [
    "Welcome to ZyraX Home",                    // English
    "Welkom bij ZyraX Home",                    // Dutch
    "Bienvenue à ZyraX Home",                   // French
    "Bienvenido a ZyraX Home",                  // Spanish
    "ようこそ ZyraX Home へ",                    // Japanese
    "欢迎来到 ZyraX Home",                       // Simplified Chinese
    "Добро пожаловать в ZyraX Home",            // Russian
    "Benvenuto in ZyraX Home",                  // Italian
    "Bem-vindo ao ZyraX Home",                  // Portuguese (Brazil)
    "Willkommen bei ZyraX Home",                // German
    "Witamy w ZyraX Home",                      // Polish
    "Välkommen till ZyraX Home",                // Swedish
    "Tervetuloa ZyraX Homeen",                  // Finnish
    "Selamat datang di ZyraX Home",             // Indonesian / Malay
    "Chào mừng bạn đến với ZyraX Home",         // Vietnamese
    "स्वागत है ZyraX Home में",                     // Hindi
    "مرحبا بك في ZyraX Home",                  // Arabic
    "ברוך הבא ל־ZyraX Home",                   // Hebrew
    "Καλώς ήρθατε στο ZyraX Home",              // Greek
    "Velkommen til ZyraX Home",                 // Danish / Norwegian
    "ZyraX Home에 오신 것을 환영합니다",          // Korean
    "ZyraX Home'a hoş geldiniz",                // Turkish
    "Üdvözöljük a ZyraX Home-ban",              // Hungarian
    "Dobrodošli u ZyraX Home",                  // Croatian / Serbian
    "Vitajte v ZyraX Home",                     // Slovak
    "Laipni lūdzam ZyraX Home",                 // Latvian
    "Sveiki atvykę į ZyraX Home",               // Lithuanian
    "Bine ați venit la ZyraX Home",             // Romanian
    "Dobrodošli v ZyraX Home",                  // Slovenian
];
//#endregion

//#region Variables
let languageIndex = 0;                                                          //For welcome textx
//#endregion

let selectedProfilePictureFile = null;

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
            createAccount();
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


/******************************************************************************/
/*!
    @brief  When page finished loading, this function is executed.
*/
/******************************************************************************/
$(document).ready(function() {
    scrollToTop();
    rotateText();
    setInterval(rotateText, 8000);
    loadLanguageSelectOptions(profileLanguageSelectElem);
});

/******************************************************************************/
/*!
    @brief  Adds an account to the system.
*/
/******************************************************************************/
async function createAccount() {
    let data = validateAccount();
    if (!data) {
        return;
    }

    const result = await httpPostRequestJsonReturn("/add_account", data);
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageAccountFieldElem.style.display = "inline-block";
        errorMessageAccountFieldElem.textContent = result.message;
        return;
    }

    loginAccount.id = result.message.id;
    scrollToSection("profileContainer");
}

/******************************************************************************/
/*!
    @brief  Adds a profile to the account.
*/
/******************************************************************************/
async function createProfile() {
    let data = validateProfile();
    if (!data) {
        return;
    }

    const result = await httpPostRequestJsonReturn("/add_profile", data);
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageProfileFieldElem.style.display = "inline-block";
        errorMessageProfileFieldElem.textContent = result.message;
        return;
    }

    data.id = result.message.id;

    /* Upload profile picture */
    if (selectedProfilePictureFile) {
        const formData = new FormData();
        formData.append("image", selectedProfilePictureFile);
        formData.append("profile_id", data.id);

        await fetch("/upload_profile_picture", {
            method: "POST",
            body: formData
        });
    }

    if (rememberUser) {
        localStorage.setItem("profileId", data.id);
    } else {
        sessionStorage.setItem("profileId", data.id);
    }
    selectedProfile.name = data.name;
    selectedProfile.language = data.language;
    userProfiles.push(data);
    scrollToSection("moduleConfigurationContainer");
}

/******************************************************************************/
/*!
    @brief  Rotates the welcome title.
*/
/******************************************************************************/
function rotateText() {
    welcomeTitleElem.style.opacity = 0;

    setTimeout(() => {
        welcomeTitleElem.textContent = WELCOME_TEXTS[languageIndex];
        welcomeTitleElem.style.opacity = 1;

        languageIndex = (languageIndex + 1) % WELCOME_TEXTS.length;
    }, 1000);
}

/******************************************************************************/
/*!
    @brief  Updates the password validation icons based on input.
*/
/******************************************************************************/
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