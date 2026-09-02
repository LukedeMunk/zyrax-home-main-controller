################################################################################
#
# File:     server_manager.py
# Version:  0.9.0
# Author:   Luke de Munk
#
# Brief:    Server manager manages the server. Creates the database, registers
#           Flask blueprints and configures the Flask webserver.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
from flask import Flask, session                                                #Import Flask and session
from flask_sqlalchemy import SQLAlchemy                                         #Import Flask FlaskSQLAlchemy
import os
import sqlite3
import configuration as c                                                       #Import application configuration variables
from datetime import datetime, timedelta
import json                                                                     #To generate JSON response strings
from cryptography.fernet import Fernet
from logger import logi, logw, loge                                             #Import logging functions
from TelegramServiceClient import *
from WeatherServiceClient import *
from expiringdict import ExpiringDict                                           #To keep track of RF codes

from sqlalchemy import event, inspect                                           #Inspect DB engine
from sqlalchemy.engine import Engine

#Flask configuration
app = Flask(__name__)
db =  SQLAlchemy()


@event.listens_for(Engine, "connect")
def enable_sqlite_foreign_keys(database_connection, connection_record):
    if not isinstance(database_connection, sqlite3.Connection):
        return

    cursor = database_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

if c.PRODUCTION_MODE:
    import RPi.GPIO as GPIO                                                     #For RF purposes
    from rpi_rf import RFDevice                                                 #For RF purposes
    GPIO.setwarnings(False)

rf_device = None
last_received_rf_codes = ExpiringDict(max_age_seconds=30, max_len=50)           #For showing received RF codes in the UI
last_received_rf_codes[0] = 0

telegram_service_state = None#Can be removed?
weather_service_state = None#Can be removed?


class DatabaseInformation(db.Model):
    __tablename__ = "DatabaseInformation"
    id = db.Column(db.Integer, primary_key=True)
    last_version_update = db.Column(db.DateTime, default=lambda: datetime.now(c.TIME_ZONE), nullable=False)
    version = db.Column(db.String(10), default=c.CURRENT_APPLICATION_VERSION, nullable=False)
    original_version = db.Column(db.String(10), default=c.CURRENT_APPLICATION_VERSION, nullable=False)

#region Account tables
class Account(db.Model):
    __tablename__ = "Account"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(256), unique=True, nullable=False)              #Encrypted
    password = db.Column(db.String(256), nullable=False)                        #Hashed
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(c.TIME_ZONE), nullable=False)
    last_logged_in_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(c.TIME_ZONE), nullable=False)

class Profile(db.Model):
    __tablename__ = "Profile"
    id = db.Column(db.Integer, primary_key=True)
    account_id = db.Column(db.Integer, nullable=False)
    profile_picture = db.Column(db.String(256), nullable=False, default=c.DEFAULT_PROFILE_PICTURE_FILENAME)
    name = db.Column(db.String(256), nullable=False)
    language = db.Column(db.Integer, nullable=False)
    ui_theme = db.Column(db.Integer, nullable=False, default=c.UI_THEME_DARK_BLUE)
    created_at = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(c.TIME_ZONE), nullable=False)

class DashboardConfiguration(db.Model):
    __tablename__ = "DashboardConfiguration"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    icon = db.Column(db.String(50), nullable=False, default="fa-duotone fa-solid fa-grid-horizontal fa-lg")

#class AccountHasDashboardConfiguration(db.Model): For now unimplemented
#    __tablename__ = "AccountHasDashboardConfiguration"
#    id = db.Column(db.Integer, primary_key=True)
#    account_id = db.Column(db.Integer, nullable=False)
#    configuration_id = db.Column(db.Integer, nullable=False)

#class ProfileHasFavouriteDashboardConfiguration(db.Model): For now unimplemented
#    __tablename__ = "ProfileHasFavouriteDashboardConfiguration"
#    id = db.Column(db.Integer, primary_key=True)
#    profile_id = db.Column(db.Integer, nullable=False)
#    configuration_id = db.Column(db.Integer, nullable=False)
        
class DashboardHasTile(db.Model):
    __tablename__ = "DashboardHasTile"
    id = db.Column(db.Integer, primary_key=True)
    configuration_id = db.Column(
        db.Integer,
        db.ForeignKey("DashboardConfiguration.id", ondelete="CASCADE"),
        nullable=False
    )
    device_id = db.Column( db.Integer, db.ForeignKey("Device.id", ondelete="CASCADE"))
    group_id = db.Column(db.Integer, db.ForeignKey("Group.id", ondelete="CASCADE"))
    automation_id = db.Column(db.Integer, db.ForeignKey("Automation.id", ondelete="CASCADE"))
    index = db.Column(db.Integer, nullable=False)
    position_x = db.Column(db.Integer)
    position_y = db.Column(db.Integer)
    type = db.Column(db.Integer, nullable=False)
    size = db.Column(db.Integer, nullable=False)
#endregion

#region Alarm tables
class Alarm(db.Model):
    __tablename__ = "Alarm"
    id = db.Column(db.Integer, primary_key=True)
    automatically_armed = db.Column(db.Boolean, nullable=False, default=False)
    armed = db.Column(db.Boolean, nullable=False, default=False)
    activated = db.Column(db.Boolean, nullable=False, default=False)

class AlarmIsTriggered(db.Model):
    __tablename__ = "AlarmHIsTriggered"
    id = db.Column(db.Integer, primary_key=True)
    alarm_id = db.Column(db.Integer, nullable=False)
    trigger_device_id = db.Column(db.Integer, nullable=False)
    datetime = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(c.TIME_ZONE), nullable=False)

class AlarmHasTriggerDevice(db.Model):
    __tablename__ = "AlarmHasTriggerDevice"
    id = db.Column(db.Integer, primary_key=True)
    alarm_id = db.Column(db.Integer, nullable=False)
    device_id = db.Column(db.Integer, nullable=False)

class AlarmHasDeactivationDevice(db.Model):
    __tablename__ = "AlarmHasDeactivationDevice"
    id = db.Column(db.Integer, primary_key=True)
    alarm_id = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(50), nullable=False)
    ip_address = db.Column(db.String(50), nullable=False)
    mac_address = db.Column(db.String(50), nullable=False)
#endregion
    
#region Device tables
class Integration(db.Model):
    __tablename__ = "Integration"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    type = db.Column(db.String(50), nullable=False)
    enabled = db.Column(db.Boolean, nullable=False, default=True)
    configuration = db.Column(db.Text, nullable=False, default="{}")

class Device(db.Model):
    __tablename__ = "Device"
    id = db.Column(db.Integer, primary_key=True)
    integration_id = db.Column(db.Integer, db.ForeignKey("Integration.id", ondelete="SET NULL"))
    location_id = db.Column(db.Integer, nullable=False, default=-1)
    name = db.Column(db.String(50), unique=True, nullable=False)
    icon = db.Column(db.String(50), nullable=False, default="fa-duotone fa-solid fa-microchip")
    type = db.Column(db.Integer, nullable=False)
    model_id = db.Column(db.Integer, nullable=False)##
    category = db.Column(db.Integer, nullable=False)##

class Entity(db.Model):
    __tablename__ = "Entity"
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(
        db.Integer,
        db.ForeignKey("Device.id", ondelete="CASCADE"),
        nullable=False
    )
    external_id = db.Column(db.String(100), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    state = db.Column(db.Text, nullable=False, default="{}")

    __table_args__ = (
        db.UniqueConstraint(
            "device_id",
            "external_id",
            name="uq_entity_device_external"
        ),
    )

class EntityHasCapability(db.Model):
    __tablename__ = "EntityHasCapability"
    id = db.Column(db.Integer, primary_key=True)
    entity_id = db.Column(db.Integer, db.ForeignKey("Entity.id", ondelete="CASCADE"), nullable=False)
    capability = db.Column(db.String(50), nullable=False)

    __table_args__ = (
        db.UniqueConstraint(
            "entity_id",
            "capability",
            name="uq_entity_capability"
        ),
    )

class Location(db.Model):
    __tablename__ = "Location"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    icon = db.Column(db.String(50), nullable=False, default="fa-duotone fa-solid fa-person-shelter")

class RfDevice(db.Model):
    __tablename__ = "RfDevice"
    id = db.Column(db.Integer, primary_key=True)
    state = db.Column(db.Boolean, nullable=False, default=False)
    icon_low_state = db.Column(db.String(50), nullable=False, default="fa-duotone fa-solid fa-microchip")
    low_battery = db.Column(db.Boolean, nullable=False, default=False)

class RfDeviceHasRfCode(db.Model):
    __tablename__ = "RfDeviceHasRfCode"
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(50), nullable=False)
    rf_code = db.Column(db.Integer, nullable=False, index=True, unique=True)
    protocol = db.Column(db.String(50), nullable=False, default="ev1527")
    type = db.Column(db.Integer, nullable=False)                                    #presence detected, opened, closed, low battery, remotecontrolBtn

class RfDeviceIsTriggered(db.Model):
    __tablename__ = "RfDeviceIsTriggered"
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.Integer, nullable=False)
    datetime = db.Column(db.DateTime(timezone=True), default=lambda: datetime.now(c.TIME_ZONE), nullable=False)

class IpCamera(db.Model):
    __tablename__ = "IpCamera"
    id = db.Column(db.Integer, primary_key=True)
    hostname = db.Column(db.String(20), nullable=False)
    ip_address = db.Column(db.String(20), nullable=False)
    port = db.Column(db.Integer, nullable=False, default=80)
    connection_status = db.Column(db.Boolean, nullable=False, default=False)
    firmware_version = db.Column(db.String(20), nullable=False, default=c.DEFAULT_FIRMWARE_VERSION)
    sd_card_inserted = db.Column(db.Boolean, nullable=False, default=False)

class LedstripDB(db.Model):
    __tablename__ = "Ledstrip"
    id = db.Column(db.Integer, primary_key=True)
    hostname = db.Column(db.String(20), nullable=False)
    ip_address = db.Column(db.String(20), nullable=False, default=c.DEFAULT_IP_ADDRESS)
    icon_low_state = db.Column(db.String(50), nullable=False, default="fa-duotone fa-solid fa-microchip")
    port = db.Column(db.Integer, nullable=False, default=80)
    connection_status = db.Column(db.Boolean, nullable=False, default=False)
    power = db.Column(db.Boolean, nullable=False, default=True)
    firmware_version = db.Column(db.String(20), nullable=False, default=c.DEFAULT_FIRMWARE_VERSION)
    sd_card_inserted = db.Column(db.Boolean, nullable=False, default=False)
    number_of_leds = db.Column(db.Integer, nullable=False, default=0)
    #driver = db.Column(db.Integer, nullable=False, default=c.LEDSTRIP_MODEL_WS2801)
    brightness = db.Column(db.Integer, nullable=False, default=255)
    mode = db.Column(db.Integer, nullable=False, default=1)
    power_animation = db.Column(db.Integer, nullable=False, default=c.POWER_ANIMATION_FADE)
    has_sensor = db.Column(db.Boolean, nullable=False, default=False)
    sensor_inverted = db.Column(db.Boolean, nullable=False, default=False)
    sensor_model = db.Column(db.Integer, nullable=False, default=c.LEDSTRIP_SENSOR_MODEL_CONTACT_SWITCH)
    sensor_state = db.Column(db.Boolean, nullable=False, default=False)

class Pixel(db.Model):
    __tablename__ = "Pixel"
    id = db.Column(db.Integer, primary_key=True)
    ledstrip_id = db.Column(db.Integer, nullable=False)
    segment_index = db.Column(db.Integer, nullable=False)
    index = db.Column(db.Integer, nullable=False)
    address = db.Column(db.Integer, nullable=False)

class PixelSegment(db.Model):
    __tablename__ = "PixelSegment"
    id = db.Column(db.Integer, primary_key=True)
    ledstrip_id = db.Column(db.Integer, nullable=False)
    segment_index = db.Column(db.Integer, nullable=False)
    type = db.Column(db.Integer, nullable=False)                                        #LEDSTRIP or INACTIVE
    x1 = db.Column(db.Integer, nullable=False)
    y1 = db.Column(db.Integer, nullable=False)
    x2 = db.Column(db.Integer, nullable=False)
    y2 = db.Column(db.Integer, nullable=False)

class Group(db.Model):
    __tablename__ = "Group"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    icon = db.Column(db.String(50), nullable=False, default="fa-duotone fa-solid fa-sensor")
    type = db.Column(db.Integer, nullable=False)
    synchronized = db.Column(db.Boolean, nullable=False, default=False)

class GroupHasDevice(db.Model):
    __tablename__ = "GroupHasDevice"
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, nullable=False)
    device_id = db.Column(db.Integer, nullable=False)
#endregion

#region Automations
class Automation(db.Model):
    __tablename__ = "Automation"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    enabled = db.Column(db.Boolean, nullable=False, default=True)
    trigger_match = db.Column(db.String(20), nullable=False, default="any")
    concurrency_policy = db.Column(
        db.String(20),
        nullable=False,
        default=c.AUTOMATION_CONCURRENCY_RESTART
    )
    error_policy = db.Column(
        db.String(20),
        nullable=False,
        default=c.AUTOMATION_ERROR_STOP
    )

class AutomationTrigger(db.Model):
    __tablename__ = "AutomationTrigger"
    id = db.Column(db.Integer, primary_key=True)
    automation_id = db.Column(
        db.Integer,
        db.ForeignKey("Automation.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    type = db.Column(db.String(50), nullable=False, index=True)
    source_type = db.Column(db.String(50))
    source_id = db.Column(db.Integer, index=True)
    configuration = db.Column(db.Text, nullable=False, default="{}")
    ordering = db.Column(db.Integer, nullable=False, default=0)

class AutomationCondition(db.Model):
    __tablename__ = "AutomationCondition"
    id = db.Column(db.Integer, primary_key=True)
    automation_id = db.Column(
        db.Integer,
        db.ForeignKey("Automation.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    type = db.Column(db.String(50), nullable=False)
    configuration = db.Column(db.Text, nullable=False, default="{}")
    ordering = db.Column(db.Integer, nullable=False, default=0)

class AutomationAction(db.Model):
    __tablename__ = "AutomationAction"
    id = db.Column(db.Integer, primary_key=True)
    automation_id = db.Column(
        db.Integer,
        db.ForeignKey("Automation.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    type = db.Column(db.String(50), nullable=False)
    configuration = db.Column(db.Text, nullable=False, default="{}")
    ordering = db.Column(db.Integer, nullable=False, default=0)

class DomainEvent(db.Model):
    __tablename__ = "DomainEvent"
    id = db.Column(db.String(36), primary_key=True)
    type = db.Column(db.String(50), nullable=False, index=True)
    source_type = db.Column(db.String(50), nullable=False)
    source_id = db.Column(db.String(100), nullable=False, index=True)
    payload = db.Column(db.Text, nullable=False, default="{}")
    correlation_id = db.Column(db.String(36))
    causation_id = db.Column(db.String(36))
    occurred_at = db.Column(db.DateTime(timezone=True), nullable=False)

class AutomationRun(db.Model):
    __tablename__ = "AutomationRun"
    id = db.Column(db.Integer, primary_key=True)
    automation_id = db.Column(
        db.Integer,
        db.ForeignKey("Automation.id", ondelete="SET NULL"),
        index=True
    )
    event_id = db.Column(db.String(36), db.ForeignKey("DomainEvent.id", ondelete="SET NULL"))
    correlation_id = db.Column(db.String(36))
    source = db.Column(db.String(50), nullable=False)
    status = db.Column(db.String(20), nullable=False, index=True)
    scheduled_for = db.Column(db.DateTime(timezone=True), nullable=False, index=True)
    started_at = db.Column(db.DateTime(timezone=True))
    finished_at = db.Column(db.DateTime(timezone=True))
    error = db.Column(db.Text)
    deduplication_key = db.Column(db.String(150), unique=True)
    created_at = db.Column(
        db.DateTime(timezone=True),
        default=lambda: datetime.now(c.TIME_ZONE),
        nullable=False
    )

class AutomationActionRun(db.Model):
    __tablename__ = "AutomationActionRun"
    id = db.Column(db.Integer, primary_key=True)
    automation_run_id = db.Column(
        db.Integer,
        db.ForeignKey("AutomationRun.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    command_id = db.Column(db.String(36), nullable=False, unique=True)
    capability = db.Column(db.String(50), nullable=False)
    target_type = db.Column(db.String(50), nullable=False)
    target_id = db.Column(db.String(100), nullable=False)
    parameters = db.Column(db.Text, nullable=False, default="{}")
    status = db.Column(db.String(20), nullable=False)
    started_at = db.Column(db.DateTime(timezone=True))
    finished_at = db.Column(db.DateTime(timezone=True))
    error = db.Column(db.Text)

class AutomationSchedulerState(db.Model):
    __tablename__ = "AutomationSchedulerState"
    id = db.Column(db.Integer, primary_key=True)
    last_checked_at = db.Column(db.DateTime(timezone=True))
#endregion

#region Modes
class Mode(db.Model):
    __tablename__ = "Mode"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)

class ModeParameter(db.Model):
    __tablename__ = "ModeParameter"
    id = db.Column(db.Integer, primary_key=True)
    #name = db.Column(db.String(50), nullable=False)
    #human_friendly_name = db.Column(db.String(50), nullable=False)
    type = db.Column(db.Integer, nullable=False)                                #range, select, color, checkbox, directionSwitch
    default_value1 = db.Column(db.String(50), nullable=False, default="")
    default_value2 = db.Column(db.String(50), nullable=False, default="")
    minimum_value = db.Column(db.Integer)
    maximum_value = db.Column(db.Integer)

class ModeHasModeParameter(db.Model):
    __tablename__ = "ModeHasModeParameter"
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.Integer, nullable=False)
    mode_id = db.Column(db.Integer, nullable=False)
    mode_parameter_id = db.Column(db.Integer, nullable=False)
    value1 = db.Column(db.String(50), nullable=False, default="")
    value2 = db.Column(db.String(50))
#endregion

################################################################################
#
#   @brief  Generates the ledstrip mode configuration parameters needed for the
#           specific mode.
#
################################################################################
def generate_ledstrip_mode_parameters():
    for parameter in c.LEDSTRIP_MODE_PARAMETERS:
        db_parameter = ModeParameter(
            id=parameter["id"],
            type=parameter["type"],
            default_value1=parameter["default1"],
            default_value2=parameter.get("default2"),
            minimum_value=parameter.get("min"),
            maximum_value=parameter.get("max")
        )

        db.session.add(db_parameter)
        
    db.session.commit()

################################################################################
#
#   @brief  Registers all of the blueprints of the webserver.
#
################################################################################
def register_blueprints():
    from routes.alarm_blueprints import alarm_bp
    from routes.configuration_blueprints import configuration_bp
    from routes.user_blueprints import user_bp
    from routes.automation_blueprints import automation_bp
    from routes.dashboard_blueprints import dashboard_bp
    from routes.data_blueprints import data_bp
    from routes.device_blueprints import device_bp
    from routes.group_blueprints import group_bp
    from routes.ledstrip_blueprints import ledstrip_bp
    from routes.logs_blueprints import logs_bp
    from routes.ota_blueprints import ota_bp
    from routes.rf_device_blueprints import rf_device_bp
    from routes.system_blueprints import system_bp
    from routes.template_blueprints import template_bp

    app.register_blueprint(alarm_bp)
    app.register_blueprint(configuration_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(automation_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(data_bp)
    app.register_blueprint(device_bp)
    app.register_blueprint(group_bp)
    app.register_blueprint(ledstrip_bp)
    app.register_blueprint(logs_bp)
    app.register_blueprint(ota_bp)
    app.register_blueprint(rf_device_bp)
    app.register_blueprint(system_bp)
    app.register_blueprint(template_bp)

################################################################################
#
#   @brief  Creates the database with the supported ledstrip modes.
#
################################################################################
def _create_database():
    db.create_all()

    generate_ledstrip_mode_parameters()
    
    color_mode = Mode(name="Color")
    fade_mode = Mode(name="Fade")
    gradient_mode = Mode(name="Gradient")
    blink_mode = Mode(name="Blink")
    scan_mode = Mode(name="Scan")
    theater_mode = Mode(name="Theater")
    sine_mode = Mode(name="Sine")
    bouncing_balls_mode = Mode(name="Bouncing Balls")
    dissolve_mode = Mode(name="Dissolve")
    sparkle_mode = Mode(name="Sparkle")
    fireworks_mode = Mode(name="Fireworks")
    fire_mode = Mode(name="Fire")
    sweep_mode = Mode(name="Sweep")
    color_twinkels_mode = Mode(name="Color Twinkels")
    meteor_rain_mode = Mode(name="Meteors")
    color_waves_mode = Mode(name="Color Waves")

    db.session.add(DashboardConfiguration(name="Dashboard1"))
    db.session.add(Alarm())
    db.session.add(color_mode)
    db.session.add(fade_mode)
    db.session.add(gradient_mode)
    db.session.add(blink_mode)
    db.session.add(scan_mode)
    db.session.add(theater_mode)
    db.session.add(sine_mode)
    db.session.add(bouncing_balls_mode)
    db.session.add(dissolve_mode)
    db.session.add(sparkle_mode)
    db.session.add(fireworks_mode)
    db.session.add(fire_mode)
    db.session.add(sweep_mode)
    db.session.add(color_twinkels_mode)
    db.session.add(meteor_rain_mode)
    db.session.add(color_waves_mode)

    db.session.commit()
    
################################################################################
#
#   @brief  Checks the nessecary directories and creates them when not found.
#
################################################################################
def check_directories():
    #Data folder containing all other folders
    if not os.path.isdir(c.DATA_DIRECTORY):
        os.makedirs(c.DATA_DIRECTORY)

    #OTA folder
    if not os.path.isdir(c.OTA_FILE_DIRECTORY_PATH):
        os.makedirs(c.OTA_FILE_DIRECTORY_PATH)

################################################################################
#
#   @brief  Checks the nessecary files and creates them when not found.
#
################################################################################
def check_files():
    #Log file
    if not os.path.isfile(c.LOGS_PATH):
        file = open(c.LOGS_PATH, "w")
        file.close()

################################################################################
#
#   @brief  Checks the database file and creates it when not found.
#
################################################################################
def check_database():
    global app
    
    #Check database file
    if not os.path.isfile(c.DB_PATH):
        with app.app_context():
            _create_database()    
            
    _check_database_state()

################################################################################
#
#   @brief  Checks the database state. When no state is found, adds a new state
#           row. Only one row is used in this table.
#
################################################################################
def _check_database_state():
    with app.app_context():
        #Check if DatabaseInformation table exists (from application v1.2.6)
        inspector = inspect(db.engine)

        if not inspector.has_table(DatabaseInformation.__tablename__):
            logw("Creating DatabaseInformation table", True)

            DatabaseInformation.__table__.create(bind=db.engine)

            state = DatabaseInformation(
                                        id=1,
                                        version=c.APPLICATION_VERSION_0_9_0,
                                        original_version=c.APPLICATION_VERSION_0_9_0
                                    )
            db.session.add(state)
            db.session.commit()
        
        state = DatabaseInformation.query.filter_by(id=1).first()

        if state is None:
            logw(c.TEXT_DATABASE_STATE_UNKNOWN, True)
            state = DatabaseInformation(id=1)
            db.session.add(state)
            db.session.commit()
            
        if state.version == c.CURRENT_APPLICATION_VERSION:
            return
        
        logw(c.VAR_TEXT_DATABASE_VERSION_DIFFERS.format(state.version, c.CURRENT_APPLICATION_VERSION), True)

        # Add a migration function here after an update that needs a database
        # update.
        # v1.2.6 to v1.3.0
        # TODO_IN_PRODUCTION
        #if state.version == c.APPLICATION_VERSION_0_1_0:
        #    _migrate_database_008_to_010()
        #    return


################################################################################
#
#   @brief  Migrates the v1.2.6 database to v1.3.0. EXAMPLE
#
################################################################################
def _migrate_database_126_to_130():
    return

################################################################################
#
#   @brief  Initializes the Flask application
#
################################################################################
def initialize_flask_application():
    global db

    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + os.path.join(c.DB_PATH)
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    app.config["SECRET_KEY"] = c.dynamic_config.flask_encryption_key
    app.config["FLASK_DEBUG"] = not c.PRODUCTION_MODE
    
    # Persistent session cookies
    #$app.config["SESSION_PERMANENT"] = True
    app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=90)
    app.config["SESSION_REFRESH_EACH_REQUEST"] = True

    # Very important for iOS home-screen apps:
    #$app.config["SESSION_COOKIE_SAMESITE"] = "None" or "Lax"
    #app.config["SESSION_COOKIE_SECURE"] = True

    db.init_app(app)

################################################################################
#
#   @brief  Validates the microservices states.
#
################################################################################
def check_microservices():
    global telegram_service_state
    global weather_service_state

    if not c.dynamic_config.telegram_service_enabled:
        logw("Telegram service disabled")
    else:
        telegram_client = TelegramServiceClient(
            base_url=c.TELEGRAM_SERVICE_URL,
            api_key=c.dynamic_config.microservice_key
        )

        telegram_service_state = telegram_client.get_service_state()

        if telegram_service_state != SERVICE_STATE_RUNNING:
            logw("Telegram service unavailable")

    if not c.dynamic_config.weather_service_enabled:
        logw("Weather service disabled")
    else:
        weather_client = WeatherServiceClient(
            base_url=c.WEATHER_SERVICE_URL,
            api_key=c.dynamic_config.microservice_key
        )

        weather_service_state = weather_client.get_service_state()

        if weather_service_state != SERVICE_STATE_RUNNING:
            logw("Weather service unavailable")

################################################################################
#
#   @brief  Initializes the RF receiver
#
################################################################################
def initialize_rf_receiver():
    global rf_device
    rf_device = None

    if not c.dynamic_config.rpi_rf_enabled:
        logw("RF receiver disabled")
        return

    if not c.PRODUCTION_MODE:
        loge("Cannot enable RF receiver. Not available for Windows or development mode")
        return

    try:
        rf_device = RFDevice(c.RF_PIN_BCM, rx_tolerance=150)
        rf_device.enable_rx()
        logi("RF receiver enabled")
    except Exception as e:
        loge("Cannot enable RF receiver: " + str(e))
        rf_device = None
