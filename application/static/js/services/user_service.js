/******************************************************************************/
/*
 * File:    user_service.js
 * Version: 0.9.0
 * Author:  Luke de Munk
 * 
 * Brief:   Service to manage CRUD functionality for system users.
 * 
 *          More information:
 *          https://github.com/LukedeMunk/zyrax-home-main-controller
 */
/******************************************************************************/



//#region Validators
/******************************************************************************/
/*!
    @brief  Validates the account input.
    @param  onlyPassword        When true, only the password is checked
    @return bool                True if valid
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

    let data = {
        email: email,
        password: password
    }

    return data;
}

/******************************************************************************/
/*!
    @brief  Validates the profile input.
    @param  id                  Profile ID
    @return bool                True if valid
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

    let data = {
        id: id,
        name: name,
        language: language
    }

    if (id != -1 && uiTheme != undefined) {
        data.ui_theme = uiTheme;
    }

    return data;
}


//#region Submitters
/******************************************************************************/
/*!
    @brief  Adds a profile to the account.
*/
/******************************************************************************/
async function addProfile() {
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
        formData.append("picture", selectedProfilePictureFile);
        formData.append("profile_id", data.id);

        await fetch("/upload_profile_picture", {
            method: "POST",
            body: formData
        });
    }

    userProfiles.push(data);

    banners.show(TEXT_SUCCESS, TEXT_PROFILE_ADDED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);

    /* Trigger event for pages to use */
    document.dispatchEvent(
        new CustomEvent("profileChanged", {detail: {id: id, action: "add"}})
    );
}

/******************************************************************************/
/*!
    @brief  Updates the specified profile.
    @param  id                  ID of the profile
*/
/******************************************************************************/
async function updateProfile(id) {
    let data = validateProfile(id);
    if (!data) {
        return;
    }

    let profile = userProfiles[getIndexFromId(userProfiles, id)];
    let changed = false;
    if (profile.name != data.name) {
        changed = true;
    }
    if (profile.language != data.language) {
        changed = true;
    }
    if (profile.ui_theme != data.ui_theme) {
        changed = true;
    }

    if (changed) {
        const result = await httpPostRequestJsonReturn("/update_profile", data);
        
        if (result.status_code != HTTP_CODE_OK) {
            errorMessageProfileFieldElem.style.display = "inline-block";
            errorMessageProfileFieldElem.textContent = result.message;
            return;
        }
    }

    profile.name = data.name;
    profile.language = data.language;
    profile.ui_theme = data.ui_theme;
    
    setTheme(profile.ui_theme);

    //TODO take action on language and ui theme
    banners.show(TEXT_SUCCESS, TEXT_CHANGES_SAVED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);

    /* Trigger event for pages to use */
    document.dispatchEvent(
        new CustomEvent("profileChanged", {detail: {id: id, action: "update"}})
    );
}

/******************************************************************************/
/*!
    @brief  Confirmation before deleting the specified profile.
    @param  profileName             Name of the profile
*/
/******************************************************************************/
function deleteProfileConfirm(profileName) {
    return new Promise((resolve) => {
        let buttons = [DELETE_POPUP_BUTTON(resolve), CANCEL_POPUP_BUTTON(resolve)];
        
        popups.show(TEXT_Q_ARE_YOU_SURE, VAR_TEXT_Q_DELETE(profileName), buttons, MESSAGE_TYPE_WARNING);
    });
}

/******************************************************************************/
/*!
    @brief  Deletes the specified profile.
    @param  id                  ID of the profile
*/
/******************************************************************************/
async function deleteProfile(id) {
    let profile = userProfiles[getIndexFromId(userProfiles, id)];
    const choice = await deleteProfileConfirm(profile.name);
    if (choice == CHOICE_OPTION_CANCEL) return;

    const result = await httpPostRequestErrorBanner("/delete_profile", {id: id});
    if (result.status_code != HTTP_CODE_OK) return;

    for (let i = 0; i < userProfiles.length; i++) {
        if (userProfiles[i].id == id) {
            userProfiles.splice(i, 1);
            break;
        }
    }
    
    /* If deleted current profile, switch to other */
    if (profileId == e.detail.id) {
        changeProfile(userProfiles[0].id, true);
    }

    banners.show(TEXT_SUCCESS, TEXT_PROFILE_DELETED_SUCCESSFULLY, MESSAGE_TYPE_SUCCESS);

    /* Trigger event for pages to use */
    document.dispatchEvent(
        new CustomEvent("profileChanged", {detail: {id: id, action: "delete"}})
    );
}
//#endregion