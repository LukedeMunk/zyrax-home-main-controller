const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync(
    "application/static/js/ui_components/AutomationModal.js",
    "utf8"
);
const context = {};
vm.createContext(context);
vm.runInContext(source + ";this.Adapter = AutomationDraftAdapter;", context);
const Adapter = context.Adapter;

const draft = Adapter.createEmpty();
draft.name = "Normalized automation";
draft.triggers = [Adapter.createTrigger(), Adapter.createTrigger()];
draft.triggers[0].source_id = 1;
draft.triggers[0].state = 1;
draft.triggers[1].source_type = "group";
draft.triggers[1].source_id = 2;
draft.triggers[1].state = 0;
draft.conditions = [Adapter.createCondition()];
draft.actions = [
    {...Adapter.createAction(), target_type: "group", target_ids: [2]},
    {...Adapter.createAction(), type: "wait", duration_minutes: 3},
    {...Adapter.createAction(), target_ids: [4], parameters: {power: 1}}
];

const payload = Adapter.toApiPayload(draft);
assert.equal(payload.triggers.length, 2);
assert.equal(payload.triggers[1].source_type, "group");
assert.equal(payload.conditions.length, 1);
assert.equal(payload.actions.length, 3);
assert.deepEqual(Array.from(payload.actions[0].configuration.target_ids), [2]);
assert.equal(payload.actions[0].configuration.target_type, "group");
assert.equal(payload.actions[1].configuration.duration_minutes, 3);
assert.equal(source.includes("innerHTML"), false);
assert.equal(source.includes("localStorage"), false);

console.log("Automation modal normalized adapter tests passed.");
