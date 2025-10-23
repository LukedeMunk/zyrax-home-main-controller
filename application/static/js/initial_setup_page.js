/******************************************************************************/
/*
 * File:    initial_setup_page.js
 * Author:  Luke de Munk
 * Version: 0.9.0
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

/******************************************************************************/
/*!
  @brief    When page finished loading, this function is executed.
*/
/******************************************************************************/
$(document).ready(function() {
    scrollToTop();
    rotateText();
    setInterval(rotateText, 8000);
    loadLanguageSelectOptions();
});

/******************************************************************************/
/*!
  @brief    Adds an account to the system.
*/
/******************************************************************************/
function createAccount() {
    if (!validateAccount()) {
        return;
    }

    let result = httpPostRequestJsonReturn("/add_account", lastAccountData);
    
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
  @brief    Adds a profile to the account.
*/
/******************************************************************************/
async function createProfile() {
    if (!validateProfile()) {
        return;
    }

    let result = httpPostRequestJsonReturn("/add_profile", lastProfileData);
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageProfileFieldElem.style.display = "inline-block";
        errorMessageProfileFieldElem.textContent = result.message;
        return;
    }

    lastProfileData.id = result.message.id;

    /* Upload profile picture */
    if (selectedProfilePictureFile) {
        const formData = new FormData();
        formData.append("picture", selectedProfilePictureFile);
        formData.append("profile_id", lastProfileData.id);

        await fetch("/upload_profile_picture", {
            method: "POST",
            body: formData
        });
    }

    if (remember) {
        localStorage.setItem("profileId", lastProfileData.id);
    } else {
        sessionStorage.setItem("profileId", lastProfileData.id);
    }
    selectedProfile.name = lastProfileData.name;
    selectedProfile.language = lastProfileData.language;
    userProfiles.push(lastProfileData);
    scrollToSection("moduleConfigurationContainer");
}

/******************************************************************************/
/*!
  @brief    Rotates the welcome title.
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