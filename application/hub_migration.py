################################################################################
#
# File:     hub_migration.py
# Brief:    Migrates persisted hub roles and learned codes on existing controllers.
#
################################################################################
import sqlite3
from contextlib import closing

################################################################################
#
#   @brief  Renames the legacy tables and replaces the Device role constraint.
#   @param  path                SQLite database used by the controller
#
################################################################################
def migrate_hub_schema(path):
    with closing(sqlite3.connect(path)) as connection, connection:
        # Use a dedicated connection with foreign keys disabled during the table rebuild.
        connection.execute("PRAGMA foreign_keys=OFF")
        connection.execute("BEGIN IMMEDIATE")
        tables = dict(connection.execute("SELECT name, sql FROM sqlite_master WHERE type='table'"))
        for old, new in (("BridgeHost", "HubHost"), ("BridgeCode", "HubCode")):
            if old in tables:
                connection.execute(f'ALTER TABLE "{old}" RENAME TO "{new}"')
        if "BridgeCode" in tables:
            connection.execute('ALTER TABLE "HubCode" RENAME COLUMN bridge_id TO hub_id')

        schema = tables.get("Device", "")
        if "'bridge'" in schema:
            objects = connection.execute(
                "SELECT sql FROM sqlite_master WHERE tbl_name='Device' "
                "AND type IN ('index', 'trigger') AND sql IS NOT NULL"
            ).fetchall()
            definition = schema[schema.index("("):].replace("'bridge'", "'hub'")
            connection.execute('CREATE TABLE "Device_hub_migration" ' + definition)
            columns = [row[1] for row in connection.execute('PRAGMA table_info("Device")')]
            expressions = ["CASE role WHEN 'bridge' THEN 'hub' ELSE role END" if name == "role"
                           else '"' + name.replace('"', '""') + '"' for name in columns]
            connection.execute('INSERT INTO "Device_hub_migration" SELECT '
                               + ", ".join(expressions) + ' FROM "Device"')
            connection.execute('DROP TABLE "Device"')
            connection.execute('ALTER TABLE "Device_hub_migration" RENAME TO "Device"')
            for (statement,) in objects:
                connection.execute(statement)
        elif "role" in [row[1] for row in connection.execute('PRAGMA table_info("Device")')]:
            connection.execute("UPDATE Device SET role='hub' WHERE role='bridge'")

        if "'bridge'" in schema or "BridgeHost" in tables or "BridgeCode" in tables:
            if connection.execute("PRAGMA foreign_key_check").fetchone() is not None:
                raise sqlite3.IntegrityError("Foreign key violation during hub migration")
