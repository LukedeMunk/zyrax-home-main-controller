/******************************************************************************/
/*
 * File:    account_page.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   JavaScript for the account page. More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/
//#region Elements
/* Text elements */
const accountEmailTitleElem = document.getElementById("accountEmailTitle");

const profileOverviewTitleElem = document.getElementById("profileOverviewTitle");
const profileNameTitleElem = document.getElementById("profileNameTitle");
const profileLanguageTitleElem = document.getElementById("profileLanguageTitle");
const profileThemeTitleElem = document.getElementById("profileThemeTitle");

/* Fields */
const errorMessageProfileFieldElem = document.getElementById("errorMessageProfileField");
const profilePicturePreviewElem = document.getElementById("profilePicturePreview");

/* Buttons */
const submitProfileBtnElem = document.getElementById("submitProfileBtn");
const deleteProfileBtnElem = document.getElementById("deleteProfileBtn");

const changePasswordBtnElem = document.getElementById("changePasswordBtn");

/* Icons */

/* Input elements */
const accountEmailTxtElem = document.getElementById("accountEmailTxt");
const accountPasswordTxtElem = document.getElementById("accountPasswordTxt");
const accountRetypePasswordTxtElem = document.getElementById("accountRetypePasswordTxt");

const profilePictureUploadElem = document.getElementById("profilePictureUpload");

const profileNameTxtElem = document.getElementById("profileNameTxt");
const profileLanguageSelectElem = document.getElementById("profileLanguageSelect");
const profileUiThemeSelectElem = document.getElementById("profileUiThemeSelect");

/* Tables */

/* Modals */

/* Other */
const profileSelectContainerElem = document.getElementById("profileSelectContainer");
//#endregion

//#region Constants
//#endregion

//#region Variables
let selectedProfile;
//#endregion

//#region Event listeners
document.addEventListener("profileChanged", (e) => {
    loadProfileOptions(userProfiles, true, loadProfile, profileId);

    if (e.detail.action == "delete") {
        //scrollToSection("profilesContainer");
    }
});

profilePictureUploadElem.addEventListener("change", async () => {
    if (profilePictureUploadElem.files.length == 0) {
        banners.show(TEXT_WARNING, TEXT_NO_FILE_SELECTED, MESSAGE_TYPE_WARNING);
        return;
    }

    /* Validate file */
    const file = profilePictureUploadElem.files[0];
    const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
        banners.show(TEXT_ERROR, TEXT_FILE_NOT_SUPPORTED, MESSAGE_TYPE_ERROR);
        profilePictureUploadElem.value = "";
        return;
    }

    /* Upload file */
    const reader = new FileReader();
    reader.onload = async (e) => {
        let image = {
                src: e.target.result,
                file: file
            }
            
        await uploadProfilePicture(image);
    };

    reader.readAsDataURL(file);
});

window.addEventListener("scroll", () => {
    updateActiveItem(window.scrollY + 100);                                     //Offset header
});
//#endregion

const profileNavigationBarObject = new FloatingNavigationBar(PROFILE_BAR_CONFIGURATION);

/******************************************************************************/
/*!
    @brief  When page finished loading, this function is executed.
*/
/******************************************************************************/
$(document).ready(function() {
    profileNavigationBarObject.render();

    passwordModalObject.render();

    loadLanguageSelectOptions(profileLanguageSelectElem);
    loadUiThemeSelectOptions(profileUiThemeSelectElem);

    selectedProfile = userProfiles[getIndexFromId(userProfiles, profileId)];

    loadProfile();
    accountEmailTxtElem.value = account.email;
    loadProfileOptions(userProfiles, true, loadProfile, profileId);

    /* Scroll to right place */
    if (window.location.hash == "") {
        scrollToTop();
        profileNavigationBarObject.setButtonSelected("profileBtn", true);
    } else {
        setTimeout(() => { scrollToSection(window.location.hash.replace('#', '')); }, 0);
    }
});

/******************************************************************************/
/*!
    @brief  Uploads the specified signature image to the backend.
    @param  image               Image object
*/
/******************************************************************************/
async function uploadProfilePicture(image) {
    let formData = new FormData();
    formData.append("image", image.file);
    formData.append("profile_id", selectedProfile.id);

    let response = await fetch("/upload_profile_picture", {
        method: "POST",
        body: formData,
    });

    if (response.status != HTTP_CODE_OK) {
        banners.show(TEXT_IMAGE_UPLOAD_FAILED, TEXT_IMAGE_UPLOAD_FAILED, MESSAGE_TYPE_ERROR);
        return;
    }

    /* Refresh account info with the right image */
    let result = await httpGetRequestErrorBanner("/get_profiles");
    if (result.status_code != HTTP_CODE_OK) return;

    userProfiles = result.message.profiles;

    console.log(selectedProfile.id)
    console.log(profileId)
    console.log(selectedProfile.id == profileId)
    if (selectedProfile.id == profileId) {
        navigationBarObject.setButtonImage("accountNavBtn", "/get_profile_picture?id=" + profileId + "&t=" + Date.now());//t parameter for caching
    }

    loadProfile(profileId);
    loadProfileOptions(userProfiles, true, loadProfile, profileId);
}

//#region Loaders
/******************************************************************************/
/*!
    @brief  Loads the UI theme select options.
*/
/******************************************************************************/
function loadUiThemeSelectOptions(element) {
    element.innerHTML = "";
    
    for (let theme of UI_THEMES) {
        option = document.createElement("option");
        option.value = theme.id;
        option.text = theme.name;
        
        element.appendChild(option);
    }
}

/******************************************************************************/
/*!
    @brief  Loads the specified profile. When no profile specified, loads the
            current selected profile.
    @param  id                  ID of the profile to load. (-1 for empty)
*/
/******************************************************************************/
function loadProfile(id=undefined) {
    profilePictureUploadElem.value = "";

    /* -1 means add profile */
    if (id == -1) {
        profilePicturePreviewElem.src = "/get_default_profile_picture";
        profileNameTxtElem.value = "";
        profileLanguageSelectElem.value = 0;
        profileUiThemeSelectElem.selectedIndex = 0;
        submitProfileBtnElem.onclick = () => addProfile();
        deleteProfileBtnElem.style.display = "none";
        selectedProfile = {id: -1};

        scrollToSection("profileContainer");
        return;
    }

    if (id == undefined) {
        id = selectedProfile.id;
    }

    selectedProfile = userProfiles[getIndexFromId(userProfiles, id)];

    profilePicturePreviewElem.src = "/get_profile_picture?id=" + selectedProfile.id + "&t=" + Date.now();//t parameter for caching
    profileNameTxtElem.value = selectedProfile.name;
    profileLanguageSelectElem.value = selectedProfile.language;
    profileUiThemeSelectElem.selectedIndex = selectedProfile.ui_theme;
    submitProfileBtnElem.onclick = () => updateProfile(selectedProfile.id);
    deleteProfileBtnElem.onclick = () => deleteProfile(selectedProfile.id);

    if (userProfiles.length > 1) {
        deleteProfileBtnElem.style.display = "block";
    } else {
        deleteProfileBtnElem.style.display = "none";
    }

    scrollToSection("profileContainer");
}
//#endregion


//#region Utilities
/******************************************************************************/
/*!
    @brief  Loads the text of elements in the selected language.
*/
/******************************************************************************/
function loadText() {
    profileOverviewTitleElem.textContent = TEXT_PROFILES;
    profileNameTitleElem.textContent = TEXT_NAME;
    profileLanguageTitleElem.textContent = TEXT_LANGUAGE;
    profileThemeTitleElem.textContent = TEXT_UI_THEME;

    accountEmailTitleElem.textContent = TEXT_EMAIL;
    changePasswordBtnElem.textContent = TEXT_CHANGE_PASSWORD;
}

/******************************************************************************/
/*!
    @brief  Updates the active side menu item based on the scroll position.
    @param  scrollPosition      Scroll position
*/
/******************************************************************************/
function updateActiveItem(scrollPosition) {
    const sections = ["profile", "profiles", "account"];
    
    for (let id of sections) {
        const section = document.getElementById(id + "Container");
        if (!section) {
            continue;
        }

        if (scrollPosition >= section.offsetTop && scrollPosition < section.offsetTop + section.offsetHeight) {
            profileNavigationBarObject.setButtonsDeselected();
            profileNavigationBarObject.setButtonSelected(id + "Btn", true);
        }
    }
}
//#endregion