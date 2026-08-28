################################################################################
#
# File:     translations.py
# Version:  0.9.0
# Author:   Luke de Munk
#
# Brief:    Takes care of the UI translations.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
import configuration as c                                                       #Import application configuration variables

################################################################################
#
#   @brief  Returns the filename of the UI texts file of the specified language
#           ID.
#   @param  language_id         ID of the language to return
#   @return                     Filename
#
################################################################################
def get_ui_language_filename(language_id):
    filename = "language_package_"
    filename += c.LANGUAGES[language_id]["code"]
    filename += ".js"

    return filename
