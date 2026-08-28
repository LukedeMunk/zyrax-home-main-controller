################################################################################
#
# File:     ConfigurationManager.py
# Version:  0.9.0
# Author:   Luke de Munk
#
# Brief:    Configuration manager to manage the configuration file that contains
#           the application configuration.
#
#           More information: https://github.com/LukedeMunk/IDH-asset-manager
#
################################################################################
import os                                                                       #For file functionality
import secrets                                                                  #For generating the Flask encryption key
import json                                                                     #For JSON functionality
from cryptography.fernet import Fernet                                          #For generating configuration and database encryption keys
import keyring

ENCRYPTED_KEYS = {
    "database_encryption_key",
    "flask_encryption_key",
    "microservice_key",
    "default_password",
    "weather_api_key",
    "telegram_bot_token",
    "telegram_chat_id",
}

REQUIRED_KEYS = {
    "database_encryption_key",
    "flask_encryption_key",
    "microservice_key",
    "default_password",
    "weather_api_key",
    "telegram_bot_token",
    "telegram_chat_id",

    "password_expiry_days",
    "weather_service_enabled",
    "weather_location",
    "telegram_service_enabled",
    "rpi_rf_enabled"
}

################################################################################
#
#   @brief  Class to handle application file reads and writes.
#
################################################################################
class ConfigurationManager:
    ################################################################################
    #
    #   @brief  Initializes the class.
    #   @param  directory_path      Directory of the configuration file
    #   @param  file_path           Path to the configuration file
    #   @param  application_name    Name of the application
    #
    ################################################################################
    def __init__(self, directory_path, file_path, application_name):
        self.directory_path = directory_path
        self.file_path = file_path
        self.master_key_path = ""
        self.master_key = self._get_master_key()
        self.application_name = application_name
        self.data = {}

        self._configure_keyring()
        self.load()

    ################################################################################
    #
    #   @brief  Configures the encrypted file keyring for a headless service when
    #           a keyring password is provided through the environment. Native
    #           desktop keyrings remain unchanged when the variable is absent.
    #
    ################################################################################
    def _configure_keyring(self):
        keyring_password = os.environ.get("KEYRING_CRYPTFILE_PASSWORD")

        if not keyring_password:
            return

        try:
            from keyrings.cryptfile.cryptfile import CryptFileKeyring
        except ImportError as error:
            raise RuntimeError(
                "keyrings.cryptfile is required for headless keyring storage"
            ) from error

        keyring_backend = CryptFileKeyring()
        keyring_path = os.environ.get("KEYRING_CRYPTFILE_PATH")

        if keyring_path:
            keyring_backend.file_path = keyring_path

        keyring_backend.keyring_key = keyring_password
        keyring.set_keyring(keyring_backend)

    ################################################################################
    #
    #   @brief  Resets the application configuration.
    #
    ################################################################################
    def reset(self):
        self.data["default_password"] = "ZyraXHomeAdmin1!"
        self.data["weather_api_key"] = ""
        self.data["telegram_bot_token"] = ""
        self.data["telegram_chat_id"] = ""
        self.data["password_expiry_days"] = 150
        self.data["weather_service_enabled"] = False
        self.data["weather_location"] = ""
        self.data["telegram_service_enabled"] = False
        self.data["rpi_rf_enabled"] = False

        self.save()
        return

    ################################################################################
    #
    #   @brief  Checks whether the master key can be found. When not found, save a
    #           backup of the configuration file if exists, generate a key and
    #           generate a new configuration file
    #   @return                     Master encryption key
    #
    ################################################################################
    def _get_master_key(self):
        return
        key = os.environ.get(ENV_MASTER_KEY_NAME)

        #Key is in environment variable
        if key:
            return key

        #Key is in file
        if os.path.exists(self.master_key_path):
            print(f"[WARNING] The master key is read from a file, this is not recommended")
            with open(self.master_key_path, "r", encoding="utf-8") as file:
                key = file.read().strip()

            if False:                                                               #TODO_IN_PRODUCTION set to True
                os.remove(self.master_key_path)

            return key
            
        #No key found
        key = Fernet.generate_key().decode()

        print(f"[WARNING] Environment variable '{ENV_MASTER_KEY_NAME}' not found.")
        print(f"A new master key has been generated: {key}")
        print(f"The new master key is saved in: {self.master_key_path}")
        print("Please set this as an environment variable to persist encrypted data.")
        print(f"[WARNING] Do not forget to delete the: {self.master_key_path} file in production!")

        try:
            with open(self.master_key_path, "w", encoding="utf-8") as file:
                file.write(key)

        except Exception as e:
            print(f"[ERROR] Unable to create master key file: {self.master_key_path}")
            raise

        #Reset configuration file
        if os.path.exists(self.file_path):
            backup_path = f"{self.file_path}.bak"
            print(f"[WARNING] Made a backup of the existing (non decryptable) configuration file in: {backup_path}")
            os.rename(self.file_path, backup_path)
                
        return key

    ################################################################################
    #
    #   @brief  Encrypts the specified value.
    #   @param  value               Value to encrypt
    #   @return                     Encrypted value
    #
    ################################################################################
    def _encrypt(self, value):
        f = Fernet(self.master_key.encode())
        return f.encrypt(value.encode()).decode()

    ################################################################################
    #
    #   @brief  Decrypts the specified value.
    #   @param  value               Value to encrypt
    #   @return                     Decrypted value
    #
    ################################################################################
    def _decrypt(self, value):
        f = Fernet(self.master_key.encode())
        return f.decrypt(value.encode()).decode()

    ################################################################################
    #
    #   @brief  Creates a new configuration file with the necessary variables.
    #
    ################################################################################
    def _create_new_configuration_file(self):
            # Default config
            self.data = {
                "database_encryption_key": Fernet.generate_key().decode(),
                "flask_encryption_key": secrets.token_urlsafe(32),
                "microservice_key": Fernet.generate_key().decode(),
                "default_password": "ZyraXHomeAdmin1!",
                "weather_api_key": "",
                "telegram_bot_token": "",
                "telegram_chat_id": "",

                "password_expiry_days": 150,
                "weather_service_enabled": False,
                "weather_location": "",
                "telegram_service_enabled": False,
                "rpi_rf_enabled": False,
            }

            self.save()

            #key = keyring.get_password(self.application_name, "database_encryption_key")
            #if key is None:
            #    print("[INFO] Created database encryption key")
            #    keyring.set_password(self.application_name, "database_encryption_key", Fernet.generate_key().decode())
#
            #key = keyring.get_password(self.application_name, "flask_encryption_key")
            #if key is None:
            #    print("[INFO] Created Flask encryption key")
            #    keyring.set_password(self.application_name, "flask_encryption_key", secrets.token_urlsafe(32))
#
            #key = keyring.get_password(self.application_name, "microservice_key")
            #if key is None:
            #    print("[INFO] Created microservice API key")
            #    keyring.set_password(self.application_name, "microservice_key", Fernet.generate_key().decode())
#
            #key = keyring.get_password(self.application_name, "default_password")
            #if key is None:
            #    print("[INFO] Created default password")
            #    keyring.set_password(self.application_name, "default_password", )
        
    ################################################################################
    #
    #   @brief  Checks whether the configuration is valid.
    #
    ################################################################################
    def _check_configuration(self):
        for key in REQUIRED_KEYS:
            if key not in self.data:
                raise ValueError(f"Missing required config key: {key}")

    ################################################################################
    #
    #   @brief  Returns the full configuration.
    #   @param  include_encryption_keys True to include the encryption keys
    #   @return                         Dictionary containing the configuration
    #
    ################################################################################
    def get_configuration(self, include_encryption_keys=False):
        configuration = self.data.copy()

        if not include_encryption_keys:
            configuration.pop("database_encryption_key", None)
            configuration.pop("flask_encryption_key", None)
            configuration.pop("microservice_key", None)

        # Convert keys to lowercase
        configuration = {key.lower(): value for key, value in configuration.items()}

        return configuration

    ################################################################################
    #
    #   @brief  Loads the configuration from the file.
    #
    ################################################################################
    def load(self):
        if not os.path.isdir(self.directory_path):
            print("[WARNING] No configuration folder found. Creating one")
            os.makedirs(self.directory_path)

        if not os.path.isfile(self.file_path):
            print("[WARNING] No configuration file found. Creating one")
            self._create_new_configuration_file()
        
        with open(self.file_path, "r", encoding="utf-8") as file:
            self.data = json.load(file)
            
        self.data["database_encryption_key"] = keyring.get_password(self.application_name, "database_encryption_key")
        self.data["flask_encryption_key"] = keyring.get_password(self.application_name, "flask_encryption_key")
        self.data["microservice_key"] = keyring.get_password(self.application_name, "microservice_key")
        self.data["default_password"] = keyring.get_password(self.application_name, "default_password")
        self.data["weather_api_key"] = keyring.get_password(self.application_name, "weather_api_key")
        self.data["telegram_bot_token"] = keyring.get_password(self.application_name, "telegram_bot_token")
        self.data["telegram_chat_id"] = keyring.get_password(self.application_name, "telegram_chat_id")

        self._check_configuration()

        #Decrypt encrypted fields
        #for key in ENCRYPTED_KEYS:
        #    if key in self.data and self.data[key]:
        #        try:
        #            self.data[key] = self._decrypt(self.data[key])
        #        except Exception:
        #            pass                                                            #Already plaintext or corrupted

    ################################################################################
    #
    #   @brief  Saves the configuration in the file.
    #
    ################################################################################
    def save(self):
        data_to_save = self.data.copy()

        #Save encrypted fields
        for key in ENCRYPTED_KEYS:
            if key in data_to_save and data_to_save[key] is not None:
                keyring.set_password(self.application_name, key, data_to_save[key])
                del data_to_save[key]

        #Save non-encrypted fields
        with open(self.file_path, "w") as file:
            json.dump(data_to_save, file, indent=4)

    ################################################################################
    #
    #   @brief  Returns the value of the specified item.
    #   @param  item                Item to get
    #   @return                     Value
    #
    ################################################################################
    def __getattr__(self, item):
        try:
            return self.data[item]
        except KeyError:
            raise AttributeError(item)

    ################################################################################
    #
    #   @brief  Sets the specified value to the specified item.
    #   @param  item                Item to set
    #   @param  value               Value to set
    #
    ################################################################################
    def __setattr__(self, key, value):
        if key in ("directory_path", "file_path", "master_key_path", "master_key", "data", "application_name"):
            super().__setattr__(key, value)
        else:
            self.data[key] = value
            self.save()
