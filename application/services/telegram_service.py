
################################################################################
#
# File:     telegram_service.py
# Version:  0.9.0
# Author:   Luke de Munk
# Brief:    Microservice to handle Telegram traffic.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
import asyncio
import json
from fastapi import FastAPI, Header
from pydantic import BaseModel
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes
import keyring

import services_configuration as c
from contextlib import asynccontextmanager

################################################################################
#
#   @brief  Starts the lifespan handler.
#
################################################################################
@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(start_bot())
    yield
    task.cancel()                                                               #Stop on shutdown

telegram_app = None
app = FastAPI(title="Telegram Microservice", lifespan=lifespan)
messages = []

chat_id = None
bot_token = None
microservice_api_key = None

TELEGRAM_BOT_TOKEN_NAME = "TELEGRAM_BOT_TOKEN"
TELEGRAM_CHAT_ID_NAME = "TELEGRAM_CHAT_ID"
MICROSERVICE_API_KEY_NAME = "MICROSERVICE_API_KEY"
SERVICE_NAME = "Telegram_microservice"

################################################################################
#
#   @brief  FastAPI Request Model
#
################################################################################
class MessageRequest(BaseModel):
    text: str

#region Telegram Handlers
################################################################################
#
#   @brief  Processes the help command (/help).
#
################################################################################
async def process_help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    global chat_id
    
    if chat_id is None:
        chat_id = update.effective_chat.id
        keyring.set_password(SERVICE_NAME, TELEGRAM_CHAT_ID_NAME, chat_id)
        await update.message.reply_text("Chat ID saved. Now at your service.")
        
    await update.message.reply_text("HELP text")

################################################################################
#
#   @brief  Processes the user texts other than commands.
#
################################################################################
async def process_user_text(update: Update, context: ContextTypes.DEFAULT_TYPE):
    global chat_id
    
    if chat_id is None:
        chat_id = update.effective_chat.id
        keyring.set_password(SERVICE_NAME, TELEGRAM_CHAT_ID_NAME, chat_id)
        await update.message.reply_text("Chat ID saved. Now at your service.")

    messages.append(update.message.text)
    print("Received: " + update.message.text)
    await update.message.reply_text("You said: " + update.message.text)
#endregion


#region Endpoints
################################################################################
#
#   @brief  FastAPI endpoint. Reloads the configuration.
#
################################################################################
@app.post("/reload_configuration")
async def reload_configuration():
    start_bot()

    return _generate_json_http_response(c.HTTP_CODE_OK)

################################################################################
#
#   @brief  FastAPI endpoint. Sends the specified message.
#
################################################################################
@app.post("/send_message")
async def send_message(req: MessageRequest, x_api_key: str = Header(...)):
    if x_api_key != microservice_api_key:
        return _generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    if not telegram_app or not chat_id:
        return _generate_json_http_response(c.HTTP_CODE_SERVICE_UNAVAILABLE, "Service not running of chat_id ontbreekt")
    
    await telegram_app.bot.send_message(chat_id=chat_id, text=req.text)

    print("NOTE: Message sent to chat " + str(chat_id) + ": " + req.text)

    return _generate_json_http_response(c.HTTP_CODE_OK, req.text)

################################################################################
#
#   @brief  FastAPI endpoint. Returns the received messages.
#
################################################################################
@app.post("/get_received_messages")
async def get_received_messages(req: MessageRequest, x_api_key: str = Header(...)):
    if x_api_key != microservice_api_key:
        return _generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    if not telegram_app:
        return _generate_json_http_response(c.HTTP_CODE_SERVICE_UNAVAILABLE, "Service not running")
    
    return _generate_json_http_response(c.HTTP_CODE_OK, messages)

################################################################################
#
#   @brief  FastAPI endpoint. Returns the service state.
#
################################################################################
@app.post("/get_state")
async def get_state(req: MessageRequest, x_api_key: str = Header(...)):
    if x_api_key != microservice_api_key:
        return _generate_json_http_response(c.HTTP_CODE_UNAUTHORIZED)
    
    if not telegram_app:
        return _generate_json_http_response(c.HTTP_CODE_SERVICE_UNAVAILABLE, "Service is not running")
    
    return _generate_json_http_response(c.HTTP_CODE_OK, "Service is running")
#endregion

#region Utilities
################################################################################
#
#   @brief  Generates a JSON string as HTTP response.
#   @param  http_code           HTTP code to add
#   @param  message             Message to add
#   @return                     JSON string
#
################################################################################
def _generate_json_http_response(http_code, message=""):
    #If is dictionary, convert to json string
    if isinstance(message, dict):
        message = json.dumps(message)
    else:
        message = "\"" + str(message) + "\""

    json_string = "{\"status_code\":" + str(http_code) + ","
    json_string += "\"message\":" + message + "}"

    return json_string

################################################################################
#
#   @brief  (Re)starts the Telegram bot.
#
################################################################################
async def start_bot():
    global telegram_app
    global chat_id
    global bot_token
    global microservice_api_key

    chat_id = keyring.get_password(SERVICE_NAME, TELEGRAM_CHAT_ID_NAME)
    bot_token = keyring.get_password(c.APPLICATION_NAME, TELEGRAM_BOT_TOKEN_NAME)
    microservice_api_key = keyring.get_password(c.APPLICATION_NAME, MICROSERVICE_API_KEY_NAME)

    if bot_token is None:
        print("Cannot start bot, no bot token")
        return
    
    if chat_id is None:
        print("Started bot, but no chat ID")

    if telegram_app is not None:
        await telegram_app.updater.stop()
        await telegram_app.stop()
        await telegram_app.shutdown()
    
    telegram_app = ApplicationBuilder().token(bot_token).build()
    telegram_app.add_handler(CommandHandler("help", process_help_command))
    telegram_app.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), process_user_text))

    await telegram_app.bot.delete_webhook()                                     #Remove old webhook
    
    #Start bot
    await telegram_app.initialize()
    await telegram_app.start()
    await telegram_app.updater.start_polling()

    print("Telegram service started")
#endregion