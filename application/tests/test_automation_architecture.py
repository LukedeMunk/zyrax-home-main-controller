################################################################################
#
# File:     test_automation_architecture.py
# Version:  0.9.0
# Author:   Luke de Munk
#
# Brief:    Tests automation events, commands, durable runs and dashboard tiles.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################
from datetime import datetime, timedelta
import json
import unittest

import configuration as c
import database_utility as db_util
import server_manager as sm
from automation import (AdapterRegistry, AutomationEngine,
                        AutomationRunService, Event, EventDispatcher, EventType)
from automation.domain import Capability


class RecordingPowerAdapter:
    ############################################################################
    #
    #   @brief  Initializes the recording test adapter.
    #
    ############################################################################
    def __init__(self):
        self.commands = []

    ############################################################################
    #
    #   @brief  Returns capabilities exposed by the test adapter.
    #   @return list                Supported capabilities
    #
    ############################################################################
    def get_capabilities(self):
        return [Capability.POWER_SET]

    ############################################################################
    #
    #   @brief  Records an executed command.
    #   @param  command             Command to record
    #
    ############################################################################
    def execute(self, command):
        self.commands.append(command)


class AutomationArchitectureTests(unittest.TestCase):
    ############################################################################
    #
    #   @brief  Initializes the in-memory application database.
    #
    ############################################################################
    @classmethod
    def setUpClass(cls):
        sm.app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
        sm.app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
        sm.app.config["TESTING"] = True
        sm.db.init_app(sm.app)
        sm.app.config["SECRET_KEY"] = "automation-test-secret"
        from routes import automation_blueprints
        cls.automation_routes = automation_blueprints

        if "automation_blueprints.run_automation" not in sm.app.view_functions:
            sm.app.register_blueprint(automation_blueprints.automation_bp)

        cls.application_context = sm.app.app_context()
        cls.application_context.push()

    ############################################################################
    #
    #   @brief  Closes the in-memory application database.
    #
    ############################################################################
    @classmethod
    def tearDownClass(cls):
        cls.application_context.pop()

    ############################################################################
    #
    #   @brief  Creates a clean schema and automation services for every test.
    #
    ############################################################################
    def setUp(self):
        sm.db.drop_all()
        sm.db.create_all()
        self.adapter = RecordingPowerAdapter()
        self.adapter_registry = AdapterRegistry()
        self.adapter_registry.register("test_power", self.adapter)
        self.engine = AutomationEngine(self.adapter_registry)
        self.run_service = AutomationRunService(self.engine)
        self.engine.set_run_service(self.run_service)
        self.event_dispatcher = EventDispatcher()
        self.event_dispatcher.set_event_recorder(
            self.run_service.record_event
        )
        self.event_dispatcher.subscribe(self.engine.handle_event)
        self.automation_routes.dm.automation_run_service = self.run_service

    ############################################################################
    #
    #   @brief  Tests a manual run and its action history.
    #
    ############################################################################
    def test_manual_run_records_execution_history(self):
        automation_id = self._add_automation()
        success, run_id = self.run_service.run_by_id(automation_id)

        self.assertTrue(success)
        self.assertEqual(len(self.adapter.commands), 1)
        run = db_util.get_automation_run(run_id)
        self.assertEqual(
            run["status"],
            c.AUTOMATION_RUN_STATUS_COMPLETED
        )
        history = db_util.get_automation_runs(automation_id)
        self.assertEqual(len(history[0]["actions"]), 1)

    ############################################################################
    #
    #   @brief  Tests the authenticated manual automation run endpoint.
    #
    ############################################################################
    def test_manual_run_endpoint_returns_run_id(self):
        automation_id = self._add_automation()
        client = sm.app.test_client()

        with client.session_transaction() as session:
            session["account_id"] = 1

        response = client.post(
            "/run_automation",
            json={"id": automation_id, "source": "dashboard"}
        )
        response_data = json.loads(response.data)

        self.assertEqual(response_data["status_code"], c.HTTP_CODE_OK)
        self.assertIn("run_id", response_data["message"])
        self.assertEqual(len(self.adapter.commands), 1)

    ############################################################################
    #
    #   @brief  Tests indexed event-triggered execution and event persistence.
    #
    ############################################################################
    def test_device_event_runs_matching_automation(self):
        self._add_automation(trigger_device_id=12)
        self.event_dispatcher.publish(Event(
            event_type=EventType.DEVICE_STATE_CHANGED,
            source_type="device",
            source_id=12,
            payload={"state": 1}
        ))

        self.assertEqual(len(self.adapter.commands), 1)
        self.assertEqual(sm.DomainEvent.query.count(), 1)

    ############################################################################
    #
    #   @brief  Tests that delayed runs survive service recreation.
    #
    ############################################################################
    def test_delayed_run_is_persisted_and_resumed(self):
        automation_id = self._add_automation()
        automation = db_util.get_automation(id=automation_id)
        success, run_id = self.run_service.run_automation(
            automation,
            delay_seconds=60
        )
        self.assertTrue(success)
        self.assertEqual(
            db_util.get_automation_run(run_id)["status"],
            c.AUTOMATION_RUN_STATUS_PENDING
        )

        run = sm.AutomationRun.query.filter_by(id=run_id).first()
        run.scheduled_for = datetime.now(c.TIME_ZONE) - timedelta(seconds=1)
        sm.db.session.commit()

        recreated_service = AutomationRunService(self.engine)
        recreated_service.process_pending_runs()
        self.assertEqual(len(self.adapter.commands), 1)
        self.assertEqual(
            db_util.get_automation_run(run_id)["status"],
            c.AUTOMATION_RUN_STATUS_COMPLETED
        )

    ############################################################################
    #
    #   @brief  Tests multiple ordered actions in one automation.
    #
    ############################################################################
    def test_automation_supports_multiple_actions(self):
        configuration = self._automation_configuration()
        configuration["actions"] = [
            {
                "type": c.AUTOMATION_ACTION_SET_DEVICE_POWER,
                "configuration": {
                    "target_device_ids": [1],
                    "parameters": [{"name": "power", "value": 1}]
                }
            },
            {
                "type": c.AUTOMATION_ACTION_COMMAND,
                "configuration": {
                    "capability": Capability.POWER_SET,
                    "target_type": "entity",
                    "target_ids": [2],
                    "parameters": {"power": 0}
                }
            }
        ]
        success, automation_id = db_util.add_automation(configuration)
        self.assertTrue(success)

        self.run_service.run_by_id(automation_id)
        self.assertEqual(len(self.adapter.commands), 2)
        self.assertEqual(self.adapter.commands[0].target_id, 1)
        self.assertEqual(self.adapter.commands[1].target_id, 2)

    ############################################################################
    #
    #   @brief  Tests an automation reference stored on a dashboard tile.
    #
    ############################################################################
    def test_dashboard_tile_stores_automation_target(self):
        automation_id = self._add_automation()
        dashboard = sm.DashboardConfiguration(name="Test dashboard")
        sm.db.session.add(dashboard)
        sm.db.session.commit()
        success, tile_id = db_util.add_dashboard_tile({
            "configuration_id": dashboard.id,
            "type": c.TILE_TYPE_AUTOMATION,
            "size": c.TILE_SIZE_1X1,
            "automation_id": automation_id
        })

        self.assertTrue(success)
        tile = sm.DashboardHasTile.query.filter_by(id=tile_id).first()
        self.assertEqual(tile.automation_id, automation_id)

    ############################################################################
    #
    #   @brief  Tests free dashboard positions and collision prevention.
    #
    ############################################################################
    def test_dashboard_tiles_use_non_overlapping_positions(self):
        dashboard = sm.DashboardConfiguration(name="Position dashboard")
        sm.db.session.add(dashboard)
        sm.db.session.commit()

        first_result = db_util.add_dashboard_tile({
            "configuration_id": dashboard.id,
            "type": c.TILE_TYPE_DATETIME,
            "size": c.TILE_SIZE_2X2
        })
        second_result = db_util.add_dashboard_tile({
            "configuration_id": dashboard.id,
            "type": c.TILE_TYPE_WEATHER,
            "size": c.TILE_SIZE_2X2
        })
        first_tile = sm.DashboardHasTile.query.filter_by(
            id=first_result[1]
        ).first()
        second_tile = sm.DashboardHasTile.query.filter_by(
            id=second_result[1]
        ).first()

        self.assertEqual((first_tile.position_x, first_tile.position_y), (0, 0))
        self.assertEqual((second_tile.position_x, second_tile.position_y), (2, 0))

        overlap_result = db_util.update_dashboard_tile(second_tile.id, {
            "position_x": 0,
            "position_y": 0
        })
        self.assertFalse(overlap_result[0])

    ############################################################################
    #
    #   @brief  Tests dashboard reset compacts explicitly positioned tiles.
    #
    ############################################################################
    def test_dashboard_reset_compacts_positions(self):
        dashboard = sm.DashboardConfiguration(name="Reset dashboard")
        sm.db.session.add(dashboard)
        sm.db.session.commit()
        tile_ids = []

        for position_y in [8, 12]:
            success, tile_id = db_util.add_dashboard_tile({
                "configuration_id": dashboard.id,
                "type": c.TILE_TYPE_DATETIME,
                "size": c.TILE_SIZE_1X1,
                "position_x": 0,
                "position_y": position_y
            })
            self.assertTrue(success)
            tile_ids.append(tile_id)

        db_util.reset_dashboard_tile_order(dashboard.id)
        tiles = [
            sm.DashboardHasTile.query.filter_by(id=tile_id).first()
            for tile_id in tile_ids
        ]

        self.assertEqual((tiles[0].position_x, tiles[0].position_y), (0, 0))
        self.assertEqual((tiles[1].position_x, tiles[1].position_y), (1, 0))

    ############################################################################
    #
    #   @brief  Tests that a time slot creates one deduplicated run.
    #
    ############################################################################
    def test_time_trigger_is_deduplicated(self):
        current_date_time = datetime.now(c.TIME_ZONE).replace(
            second=0,
            microsecond=0
        )
        configuration = self._automation_configuration()
        configuration["trigger"] = c.AUTOMATION_TRIGGER_TIMER
        configuration["days"] = [current_date_time.weekday()]
        configuration["time"] = current_date_time.strftime("%H:%M")
        success, automation_id = db_util.add_automation(configuration)
        self.assertTrue(success)

        self.run_service.process_time_triggers()
        self.run_service.process_time_triggers()

        history = db_util.get_automation_runs(automation_id)
        self.assertEqual(len(history), 1)
        self.assertEqual(len(self.adapter.commands), 1)

    ############################################################################
    #
    #   @brief  Tests restart concurrency cancellation for delayed runs.
    #
    ############################################################################
    def test_restart_policy_cancels_previous_pending_run(self):
        automation_id = self._add_automation()
        automation = db_util.get_automation(id=automation_id)
        first_result = self.run_service.run_automation(
            automation,
            delay_seconds=60
        )
        second_result = self.run_service.run_automation(
            automation,
            delay_seconds=60
        )

        first_run = db_util.get_automation_run(first_result[1])
        second_run = db_util.get_automation_run(second_result[1])
        self.assertEqual(
            first_run["status"],
            c.AUTOMATION_RUN_STATUS_CANCELLED
        )
        self.assertEqual(
            second_run["status"],
            c.AUTOMATION_RUN_STATUS_PENDING
        )

    ############################################################################
    #
    #   @brief  Adds a compatible existing-format automation.
    #   @param  trigger_device_id   Optional event source device
    #   @return int                 Automation ID
    #
    ############################################################################
    def _add_automation(self, trigger_device_id=None):
        configuration = self._automation_configuration()

        if trigger_device_id is not None:
            configuration["trigger_device_ids"] = [trigger_device_id]

        success, automation_id = db_util.add_automation(configuration)
        self.assertTrue(success)
        return automation_id

    ############################################################################
    #
    #   @brief  Returns a compatible existing-format automation configuration.
    #   @return dict                Automation configuration
    #
    ############################################################################
    def _automation_configuration(self):
        return {
            "name": "Test automation",
            "action": c.AUTOMATION_ACTION_SET_DEVICE_POWER,
            "trigger": c.AUTOMATION_TRIGGER_SWITCH,
            "trigger_device_ids": [],
            "trigger_state": 1,
            "target_device_ids": [1],
            "parameters": [{"name": "power", "value": 1}],
            "delay_minutes": 0,
            "inverted_automation_copy_id": -1
        }


if __name__ == "__main__":
    unittest.main()
