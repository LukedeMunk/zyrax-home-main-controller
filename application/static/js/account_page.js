/******************************************************************************/
/*
 * File:    account_page.js
 * Author:  Luke de Munk
 * Version: 0.9.0
 * 
 * Brief:   JavaScript for the account page. More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/
//#region Elements
/* Text elements */
const welcomeTitleElem = document.getElementById("welcomeTitle");

/* Fields */

/* Buttons */
const submitProfileBtnElem = document.getElementById("submitProfileBtn");
const deleteProfileBtnElem = document.getElementById("deleteProfileBtn");

const changePasswordBtnElem = document.getElementById("changePasswordBtn");

/* Icons */

/* Input elements */
const profileUiThemeSelectElem = document.getElementById("profileUiThemeSelect");

/* Tables */

/* Modals */

/* Other */
const profileSelectContainerElem = document.getElementById("profileSelectContainer");
const passwordUpdateContainerElem = document.getElementById("passwordUpdateContainer");

//#endregion

//#region Constants
//#endregion

//#region Variables
let selectedProfile;
//#endregion

//#region Event listeners
profilePictureUploadElem.addEventListener("change", async () => {
    /* Upload profile picture */
    if (!selectedProfilePictureFile) {
        showBanner(TEXT_WARNING, TEXT_NO_FILE_SELECTED, BANNER_TYPE_WARNING);
        return;
    }

    if (selectedProfile.id == -1) {
        return;
    }

    const formData = new FormData();
    formData.append("picture", selectedProfilePictureFile);
    formData.append("profile_id", selectedProfile.id);

    try {
        const response = await fetch("/upload_profile_picture", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            showBanner(TEXT_SERVER_ERROR, TEXT_SERVER_ERROR + ": " + response.statusText, BANNER_TYPE_ERROR);
            return
        }

        if (selectedProfile.id == -1 || selectedProfile.id == profileId) {
            const newImg = document.createElement("img");
            newImg.src = "/get_profile_picture?t=" + new Date().getTime();
            newImg.id = navBarProfilePictureElem.id;
            newImg.className = navBarProfilePictureElem.className;
            newImg.style.cssText = navBarProfilePictureElem.style.cssText;

            navBarProfilePictureElem.replaceWith(newImg);
            navBarProfilePictureElem = newImg;
        }

        loadProfiles(userProfiles, true, "loadProfile", profileId);
    } catch (error) {
        showBanner(TEXT_SERVER_ERROR, TEXT_SERVER_ERROR + ": " + error, BANNER_TYPE_ERROR);
    }
});

window.addEventListener("scroll", () => {
    updateActiveItem(window.scrollY + 100);                                     //Offset header
});
//#endregion

/******************************************************************************/
/*!
  @brief    When page finished loading, this function is executed.
*/
/******************************************************************************/
$(document).ready(function() {
    /* Scroll to right place */
    if (window.location.hash == "") {
        scrollToTop();
    } else {
        setTimeout(() => { scrollToSection(window.location.hash.replace('#', '')); }, 0);
    }

    loadLanguageSelectOptions();
    loadUiThemeSelectOptions();

    selectedProfile = userProfiles[getIndexFromId(userProfiles, profileId)];

    loadProfile();
    loadProfiles(userProfiles, true, "loadProfile", profileId);
    loadAccount();
});

//#region Loaders
/******************************************************************************/
/*!
  @brief    Loads the UI theme select options.
*/
/******************************************************************************/
function loadUiThemeSelectOptions() {
    profileUiThemeSelectElem.innerHTML = "";
    
    for (let theme of UI_THEMES) {
        option = document.createElement("option");
        option.value = theme.id;
        option.text = theme.name;
        
        profileUiThemeSelectElem.appendChild(option);
    }
}

/******************************************************************************/
/*!
  @brief    Loads the specified profile. When no profile specified, loads the
            current selected profile.
  @param    id                  ID of the profile to load. (-1 for empty)
*/
/******************************************************************************/
function loadProfile(id=undefined) {
    profilePictureUploadElem.value = "";
    selectedProfilePictureFile = null;

    /* -1 means add profile */
    if (id == -1) {
        profilePicturePreviewElem.src = "/get_default_profile_picture";
        profileNameTxtElem.value = "";
        profileLanguageSelectElem.value = 0;
        profileUiThemeSelectElem.selectedIndex = 0;
        submitProfileBtnElem.setAttribute("onclick", "addProfile();");
        deleteProfileBtnElem.style.display = "none";
        selectedProfile = {id: -1};

        scrollToSection("profileContainer");
        return;
    }

    if (id == undefined) {
        id = selectedProfile.id;
    }

    selectedProfile = userProfiles[getIndexFromId(userProfiles, id)];
    let profile = userProfiles[getIndexFromId(userProfiles, id)];
    profilePicturePreviewElem.src = "/get_profile_picture?id=" + profile.id;
    profileNameTxtElem.value = profile.name;
    profileLanguageSelectElem.value = profile.language;
    profileUiThemeSelectElem.selectedIndex = profile.ui_theme;
    submitProfileBtnElem.setAttribute("onclick", "updateProfile(" + profile.id + ");");
    deleteProfileBtnElem.setAttribute("onclick", "deleteProfileConfirm(" + profile.id + ", '" + profile.name + "');");

    if (userProfiles.length > 1) {
        deleteProfileBtnElem.style.display = "block";
    } else {
        deleteProfileBtnElem.style.display = "none";
    }

    scrollToSection("profileContainer");
}

/******************************************************************************/
/*!
  @brief    Loads the account fields.
*/
/******************************************************************************/
function loadAccount() {
    passwordUpdateContainerElem.style.display = "none";
    changePasswordBtnElem.style.display = "block";
    
    accountEmailTxtElem.value = account.email;
    accountCurrentPasswordTxtElem.value = "";
    accountPasswordTxtElem.value = "";
    accountRetypePasswordTxtElem.value = "";

    scrollToSection("accountContainer");
    return;
}
//#endregion

//#region Submitters
/******************************************************************************/
/*!
  @brief    Adds a profile to the account.
*/
/******************************************************************************/
async function addProfile() {
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

    userProfiles.push(lastProfileData);

    loadProfiles(userProfiles, true, "loadProfile", profileId);
    showBanner(TEXT_SUCCESS, TEXT_PROFILE_ADDED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
}

/******************************************************************************/
/*!
  @brief    Updates the specified profile.
  @param    id                  ID of the profile
*/
/******************************************************************************/
function updateProfile(id) {
    if (!validateProfile(id)) {
        return;
    }

    let profile = userProfiles[getIndexFromId(userProfiles, id)];
    let changed = false;
    if (profile.name != lastProfileData.name) {
        changed = true;
    }
    if (profile.language != lastProfileData.language) {
        changed = true;
    }
    if (profile.ui_theme != lastProfileData.ui_theme) {
        changed = true;
    }

    if (changed) {
        let result = httpPostRequestJsonReturn("/update_profile", lastProfileData);
        
        if (result.status_code != HTTP_CODE_OK) {
            errorMessageProfileFieldElem.style.display = "inline-block";
            errorMessageProfileFieldElem.textContent = result.message;
            return;
        }
    }

    profile.name = lastProfileData.name;
    profile.language = lastProfileData.language;
    profile.ui_theme = lastProfileData.ui_theme;
    
    setTheme(profile.ui_theme);

    //TODO take action on language and ui theme
    showBanner(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
    loadProfiles(userProfiles, true, "loadProfile", profileId);
}

/******************************************************************************/
/*!
  @brief    Confirmation before deleting the specified profile.
  @param    id                      ID of the profile
  @param    profileName             Name of the profile
*/
/******************************************************************************/
function deleteProfileConfirm(id, profileName) {
    let buttons = [
                    {text: TEXT_DELETE, onclickFunction: "deleteProfile(" + id + ");"},
                    CANCEL_POPUP_BUTTON
                ];
    showPopup(TEXT_Q_ARE_YOU_SURE, VAR_TEXT_Q_DELETE(profileName), buttons, BANNER_TYPE_WARNING);
}

/******************************************************************************/
/*!
  @brief    Deletes the specified profile.
  @param    id                  ID of the profile
*/
/******************************************************************************/
function deleteProfile(id) {
    closePopup();

    httpPostRequest("/delete_profile", {id: id});

    for (let i = 0; i < userProfiles.length; i++) {
        if (userProfiles[i].id == id) {
            userProfiles.splice(i, 1);
            break;
        }
    }

    /* If deleted current profile, switch to other*/
    if (profileId == id) {
        profileId = userProfiles[0].id;
    }

    loadProfiles(userProfiles, true, "loadProfile", profileId);
    showBanner(TEXT_SUCCESS, TEXT_PROFILE_DELETED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
    scrollToSection("profilesContainer");
}

/******************************************************************************/
/*!
  @brief    Updates the specified profile.
*/
/******************************************************************************/
function updatePassword() {
    if (!validateAccount(true)) {
        return;
    }

    let data = {
        password: accountPasswordTxtElem.value,
        current_password: accountCurrentPasswordTxtElem.value
    }

    let result = httpPostRequestJsonReturn("/update_account_password", data);
    
    if (result.status_code != HTTP_CODE_OK) {
        errorMessageAccountFieldElem.style.display = "inline-block";
        errorMessageAccountFieldElem.textContent = result.message;
        return;
    }

    showBanner(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, BANNER_TYPE_SUCCESS);
    passwordUpdateContainerElem.style.display = "none";
    changePasswordBtnElem.style.display = "block";
}
//#endregion

//#region Utilities
/******************************************************************************/
/*!
  @brief    Updates the active side menu item based on the scroll position.
  @param    scrollPosition      Scroll position
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
            document.querySelectorAll(".sidebar-menu li").forEach(li => li.classList.remove("active"));

            const btn = document.getElementById(id + "Btn");
            if (btn) {
                btn.classList.add("active");
            }
        }
    }
}

/******************************************************************************/
/*!
  @brief    Resets and shows the password fields.
*/
/******************************************************************************/
function showPasswordFields() {
    accountCurrentPasswordTxtElem.value = "";
    accountPasswordTxtElem.value = "";
    accountRetypePasswordTxtElem.value = "";
    passwordUpdateContainerElem.style.display = "block";
    changePasswordBtnElem.style.display = "none";
}
//#endregion