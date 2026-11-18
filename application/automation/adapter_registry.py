################################################################################
#
# File:     adapter_registry.py
# Version:  0.9.0
# Author:   Luke de Munk
#
# Brief:    Registers integration adapters and dispatches events and commands.
#
#           More information:
#           https://github.com/LukedeMunk/zyrax-home-main-controller
#
################################################################################


class AdapterRoutingError(ValueError):
    """A command does not have a matching target adapter."""


class AdapterRegistry:
    ############################################################################
    #
    #   @brief  Initializes the adapter registry.
    #   @param  resolve_target      Resolves a command to its integration key
    #
    ############################################################################
    def __init__(self, resolve_target=None):
        self.adapters = {}
        self.capability_adapters = {}
        self.resolve_target = resolve_target

    ############################################################################
    #
    #   @brief  Registers an adapter and its supported capabilities.
    #   @param  name                Unique adapter name
    #   @param  adapter             Adapter instance
    #
    ############################################################################
    def register(self, name, adapter):
        if name in self.adapters:
            raise ValueError("Adapter already registered: " + name)

        for capability in set(adapter.get_capabilities()):
            self.capability_adapters.setdefault(capability, set()).add(name)

        self.adapters[name] = adapter

    ############################################################################
    #
    #   @brief  Resolves the adapter for a command target and capability.
    #   @param  command             Command to route
    #   @return                     Adapter that can execute the command
    #
    ############################################################################
    def _get_adapter(self, command):
        candidates = self.capability_adapters.get(command.capability, set())
        if self.resolve_target is not None and command.target_type in ("device", "entity"):
            adapter_name = self.resolve_target(command)
            if adapter_name not in candidates:
                raise AdapterRoutingError(
                    f"No adapter for {command.capability} on "
                    f"{command.target_type}:{command.target_id} (integration: {adapter_name})"
                )
        elif len(candidates) == 1:
            adapter_name = next(iter(candidates))
        else:
            raise AdapterRoutingError(
                f"Expected one adapter for {command.capability}, found {len(candidates)}"
            )
        return self.adapters[adapter_name]

    ############################################################################
    #
    #   @brief  Executes a command using its target adapter.
    #   @param  command             Command to execute
    #   @return                     Adapter result
    #
    ############################################################################
    def execute(self, command):
        return self._get_adapter(command).execute(command)

    ############################################################################
    #
    #   @brief  Checks whether a capability is registered or routable to a target.
    #   @param  capability          Capability to look up
    #   @param  command             Optional command identifying the target
    #   @return bool                True when supported
    #
    ############################################################################
    def has_capability(self, capability, command=None):
        if command is None:
            return capability in self.capability_adapters
        if command.capability != capability:
            return False
        try:
            self._get_adapter(command)
        except AdapterRoutingError:
            return False
        return True


class EventDispatcher:
    ############################################################################
    #
    #   @brief  Initializes the event dispatcher.
    #
    ############################################################################
    def __init__(self):
        self.subscribers = []
        self.event_recorder = None

    ############################################################################
    #
    #   @brief  Sets the callback used to persist events.
    #   @param  recorder            Event recorder callback
    #
    ############################################################################
    def set_event_recorder(self, recorder):
        self.event_recorder = recorder

    ############################################################################
    #
    #   @brief  Subscribes a callback to published events.
    #   @param  subscriber          Event callback
    #
    ############################################################################
    def subscribe(self, subscriber):
        if subscriber not in self.subscribers:
            self.subscribers.append(subscriber)

    ############################################################################
    #
    #   @brief  Persists and publishes an event.
    #   @param  event               Event to publish
    #
    ############################################################################
    def publish(self, event):
        if self.event_recorder is not None:
            self.event_recorder(event)

        for subscriber in self.subscribers:
            subscriber(event)

