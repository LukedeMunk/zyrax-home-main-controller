################################################################################
#
# File:     logger.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    For logging in file and printing logged lines
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
import datetime
import configuration as c                                                       #Import application configuration variables
import json

LOG_TYPE_INFO = 0
LOG_TYPE_WARNING = 1
LOG_TYPE_ERROR = 2
LOG_TYPE_FATAL_ERROR = 3

################################################################################
#
#   @brief  Prints log line and saves in the log file.
#   @param  text                    Line to print and save to log file
#   @param  prnt                    If True, the line is printed in the console
#
################################################################################
def logi(text, prnt = True):
    if prnt:
        print("NOTE: " + text)

    log(text, LOG_TYPE_INFO)

################################################################################
#
#   @brief  Prints log line and saves in the log file.
#   @param  text                    Line to print and save to log file
#   @param  prnt                    If True, the line is printed in the console
#
################################################################################
def logw(text, prnt = True):
    if prnt:
        print("WARNING: " + text)

    log(text, LOG_TYPE_WARNING)

################################################################################
#
#   @brief  Prints log line and saves in the log file.
#   @param  text                    Line to print and save to log file
#   @param  prnt                    If True, the line is printed in the console
#
################################################################################
def loge(text, prnt = True):
    if prnt:
        print("ERROR: " + text)

    log(text, LOG_TYPE_ERROR)

################################################################################
#
#   @brief  Prints log line and saves in the log file.
#   @param  text                    Line to print and save to log file
#   @param  typ                     Log type
#
################################################################################
def log(text, typ):
    now = datetime.datetime.now()                                               #Get current time and date
    date_string = now.strftime("%d-%m-%Y")                                      #Convert time string to string
    time_string = now.strftime("%H:%M:%S")                                      #Convert time string to string

    log_line = {
                "type" : typ,
                "log" : text,
                "date" : date_string,
                "time" : time_string
            }

    with open(c.LOGS_PATH, "a") as file:
        file.write(json.dumps(log_line) + "\n")                                 #Append to existing log file
        
################################################################################
#
#   @brief  Returns the logs.
#   @return list                    Dictionary list of the logs
#
################################################################################
def get_logs():
    log_list = []
    length = 0
    
    with open(c.LOGS_PATH) as file:
        for line in file:
            try:
                log_list.append(json.loads(line.rstrip()))
                length += 1
            except:
                pass

    log_list = list(reversed(log_list))[:250]

    return log_list

################################################################################
#
#   @brief  Resets the logs file by deleting the logs.
#
################################################################################
def reset_logs():
    file = open(c.LOGS_PATH, "r+")
    file.truncate(0)                                                            #Need "0" when using r+
    file.close()