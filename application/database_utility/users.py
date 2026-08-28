################################################################################
#
# File:     users.py
# Version:  0.9.0
# Author:   Luke de Munk
#
# Brief:    To handle CRUD functionality of the user table of the database.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
import configuration as c                                                       #Import configuration constants and global variables
from logger import logi, logw, loge                                             #For logging functionality
from datetime import datetime, timedelta                                        #For update date and time
from sqlalchemy import exc, func, or_, and_                                     #Import exeptions to catch them
import re                                                                       #For checking passwords
from argon2.exceptions import VerifyMismatchError                               #For password verifying
from argon2 import PasswordHasher                                               #For password hashing with Argon2 algoritm
from zxcvbn import zxcvbn                                                       #To verify the password strength
from cryptography.fernet import Fernet                                          #For encrypting first account data
import uuid                                                                     #For generating unique filenames

from server_manager import *                                                    #For database manipulation

from . import database_core as core

password_hasher = PasswordHasher(hash_len=128, salt_len=128)                    #To hash and verify passwords, total length: 256


#region Accounts
################################################################################
#
#   @brief  Adds a account to the database.
#   @param  data_dict           User dictionary
#   @return                     Tupel with success bool and error string
#
################################################################################
def add_account(data_dict):
    encryptor = Fernet(c.dynamic_config.database_encryption_key)                #Instance the Fernet class with the key
    encrypted_email = encryptor.encrypt(data_dict["email"].encode()).decode()
    
    accounts = Account.query.all()

    #Search for existing names
    for account in accounts:
        if encryptor.decrypt(account.email).decode() == data_dict["email"]:
            return (False, c.TEXT_EMAIL_ALREADY_EXISTS)

    account = Account(
                    email=encrypted_email,
                    password=password_hasher.hash(data_dict["password"])
                )
    
    db.session.add(account)
    
    success, error = core.commit_with_handling()

    if not success:
        return (success, error)

    return (True, get_account(account.id))

################################################################################
#
#   @brief  Updates a account based on a dictionary with provided items.
#   @param  id                  ID of the account to update
#   @param  data_dict           Dictionary with new data
#   @return                     Tupel with success bool and error string
#
################################################################################
def update_account(id, data_dict):
    encryptor = Fernet(c.dynamic_config.database_encryption_key)                #Instance the Fernet class with the key
    account = Account.query.filter_by(id=id).first()

    if account is None:
        return (False, c.TEXT_ACCOUNT_NOT_FOUND)

    accounts = Account.query.all()

    encrypted_email = encryptor.encrypt(data_dict["email"].encode()).decode()
    
    #Search for existing names
    for db_account in accounts:
        if encryptor.decrypt(db_account.email).decode() == data_dict["email"]:
            return (False, c.TEXT_EMAIL_ALREADY_EXISTS)

    account.email = encrypted_email
    
    success, error = core.commit_with_handling()

    if not success:
        return (success, error)
    
    return (True, get_account(id))

################################################################################
#
#   @brief  Deletes a account from the database.
#   @param  id                  ID of the account to delete
#   @return                     Tupel with success bool and error string
#
################################################################################
def delete_account(id):
    Account.query.filter_by(id=id).delete()
    
    return core.commit_with_handling()

################################################################################
#
#   @brief  Updates the password of the specified user.
#   @param  id                  ID of the user to update password
#   @param  password            New password of the user
#   @param  current_password    Current password of the user
#   @return                     Tupel with success bool and error string
#
################################################################################
def update_account_password(id, password, current_password=None):
    account = Account.query.filter_by(id=id).first()

    if account is None:
        return (False, c.TEXT_ACCOUNT_NOT_FOUND)
    
    if not re.search(c.RE_PASSWORD, password):
        return (False, c.TEXT_PASSWORD_NOT_STRONG)
    
    #Check whether current password is the same
    if current_password is not None:
        try:
            password_hasher.verify(account.password, current_password)
        except VerifyMismatchError:
            return (False, c.TEXT_INVALID_CURRENT_PASSWORD)

    #Check whether new password is unique
    try:
        password_hasher.verify(account.password, password)
        return (False, c.TEXT_CANNOT_BE_THE_SAME_PASSWORD)
    except VerifyMismatchError:
        pass

    account.password = password_hasher.hash(password)                           #Hash the password
    account.password_updated_at = datetime.now(c.TIME_ZONE)                     #Update date and time password updated
    
    success, error = core.commit_with_handling()

    if not success:
        return (success, error)
    
    strength_results = zxcvbn(password)

    return (True, strength_results["feedback"]["warning"])

################################################################################
#
#   @brief  Resets the password to the default one of the specified account.
#   @param  id                  ID of the account to reset password
#   @return                     True if success, otherwise false
#
################################################################################
def reset_account_password(id):
    account = Account.query.filter_by(id=id).first()

    if account is None:
        return False

    account.password = password_hasher.hash(c.DEFAULT_PASSWORD)                 #Hash the default password
    account.password_updated_at = datetime.now(c.TIME_ZONE)
    
    success, error = core.commit_with_handling()

    return success
    
################################################################################
#
#   @brief  Checks account credentials.
#   @param  email               The email of the account
#   @param  password            The password of the account
#   @return                     Tupel with success bool and error string or
#                               account
#
################################################################################
def account_login(email, password):
    encryptor = Fernet(c.dynamic_config.database_encryption_key)                #Instance the Fernet class with the key
    accounts = Account.query.all()
    account = None
    
    #Search accounts for email
    for db_account in accounts:
        #If email corresponds to a account, select account
        if encryptor.decrypt(db_account.email).decode() == email:
            account = db_account
            break

    if account is None:
        return (False, c.TEXT_WRONG_CREDENTIALS)                                #User not found by email, wrong email
    
    try:
        password_hasher.verify(account.password, password)                      #Verify if password is a match
    except VerifyMismatchError:
        return (False, c.TEXT_WRONG_CREDENTIALS)                                #Password incorrect
    
    account.last_logged_in_at = datetime.now(c.TIME_ZONE)                       #Update date and time last logged in
    
    success, error = core.commit_with_handling()

    if not success:
        return (success, error)

    #Decrypt data
    account.email = encryptor.decrypt(account.email).decode()

    account = core.row_to_dictionary(account)
    account.pop("password")

    return (True, account)                                                      #If credentials are correct, return account
    
################################################################################
#
#   @brief  Returns all users.
#   @return                     List of dictionaries of the users
#
################################################################################
def get_accounts():
    encryptor = Fernet(c.dynamic_config.database_encryption_key)                #Instance the Fernet class with the key
    accounts = Account.query.all()
    accounts_list = []

    for account in accounts:
        account = core.row_to_dictionary(account)
        account["email"] = encryptor.decrypt(account["email"]).decode()

        account.pop("password")
        accounts_list.append(account)
    
    return accounts_list

################################################################################
#
#   @brief  Returns a user dictionary based on the ID or email.
#   @param  id                  ID of the user
#   @param  email               Email of the user
#   @return                     Dictionary of the specified user
#
################################################################################
def get_account(id):
    encryptor = Fernet(c.dynamic_config.database_encryption_key)                #Instance the Fernet class with the key
    account = Account.query.filter_by(id=id).first()

    if account is None:
        loge(c.TEXT_ACCOUNT_NOT_FOUND)
        return

    account = core.row_to_dictionary(account)
    account["email"] = encryptor.decrypt(account["email"]).decode()

    account.pop("password")

    return account
#endregion

#region Users
################################################################################
#
#   @brief  Adds a profile to the database.
#   @param  data_dict           User dictionary
#   @return                     Tupel with success bool and error string
#
################################################################################
def add_profile(data_dict):
    profiles = Profile.query.all()
    
    #Search for existing names
    for db_profile in profiles:
        if db_profile.name == data_dict["name"]:
            return (False, c.TEXT_NAME_ALREADY_EXISTS)

    profile = Profile(
                    account_id=data_dict["account_id"],
                    name=data_dict["name"],
                    language=data_dict["language"]
                )
    
    db.session.add(profile)
    
    success, error = core.commit_with_handling()

    if not success:
        return (success, error)

    return (True, profile.id)

################################################################################
#
#   @brief  Updates a profile based on a dictionary with provided items.
#   @param  id                  ID of the profile to update
#   @param  data_dict           Dictionary with new data
#   @return                     Tupel with success bool and error string
#
################################################################################
def update_profile(id, data_dict):
    profile = Profile.query.filter_by(id=id).first()

    if profile is None:
        return (False, c.TEXT_PROFILE_NOT_FOUND)

    profiles = Profile.query.all()
    
    if "name" in data_dict:
        #Search for existing names
        for db_profile in profiles:
            if db_profile.id == id:
                continue

            if db_profile.name == data_dict["name"]:
                return (False, c.TEXT_NAME_ALREADY_EXISTS)
            
        profile.name = data_dict["name"]

    if "language" in data_dict:
        profile.language = data_dict["language"]

    if "profile_picture" in data_dict:
        profile.profile_picture = data_dict["profile_picture"]

    if "ui_theme" in data_dict:
        profile.ui_theme = data_dict["ui_theme"]

    success, error = core.commit_with_handling()

    if not success:
        return (success, error)
    
    return (True, "")

################################################################################
#
#   @brief  Deletes a profile from the database.
#   @param  id                  ID of the profile to delete
#   @return                     Tupel with success bool and error string
#
################################################################################
def delete_profile(id):
    profile = Profile.query.filter_by(id=id).first()

    if profile is None:
        return (False, c.TEXT_PROFILE_NOT_FOUND)

    picture_filename = profile.profile_picture
    db.session.delete(profile)
    
    success, error = core.commit_with_handling()

    if not success:
        return (success, error)

    #Remove profile picture
    if picture_filename != c.DEFAULT_PROFILE_PICTURE_FILENAME:
        path = os.path.join(c.PROFILE_PICTURES_DIRECTORY_PATH, picture_filename)
        if os.path.exists(path):
            os.remove(path)

    return (True, "")
    
################################################################################
#
#   @brief  Returns all users.
#   @return                     List of dictionaries of the users
#
################################################################################
def get_profiles(account_id):
    profiles = Profile.query.filter_by(account_id=account_id).all()
    profiles_list = []

    for profile in profiles:
        profiles_list.append(core.row_to_dictionary(profile))
    
    return profiles_list

################################################################################
#
#   @brief  Returns a user dictionary based on the ID or email.
#   @param  id                  ID of the user
#   @param  email               Email of the user
#   @return                     Dictionary of the specified user
#
################################################################################
def get_profile(id):
    profile = Profile.query.filter_by(id=id).first()

    if profile is None:
        loge(c.TEXT_PROFILE_NOT_FOUND)
        return

    profile = core.row_to_dictionary(profile)
    
    return profile
#endregion