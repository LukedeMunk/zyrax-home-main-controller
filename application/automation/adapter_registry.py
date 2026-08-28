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


class AdapterRegistry:
    ############################################################################
    #
    #   @brief  Initializes the adapter registry.
    #
    ############################################################################
    def __init__(self):
        self.adapters = {}
        self.capability_adapters = {}

    ############################################################################
    #
    #   @brief  Registers an adapter and all capabilities exposed by it.
    #   @param  name                Unique adapter name
    #   @param  adapter             Adapter instance
    #
    ############################################################################
    def register(self, name, adapter):
        if name in self.adapters:
            raise ValueError("Adapter already registered: " + name)

        for capability in adapter.get_capabilities():
            if capability in self.capability_adapters:
                raise ValueError(
                    "Capability already registered: " + capability
                )

            self.capability_adapters[capability] = name

        self.adapters[name] = adapter

    ############################################################################
    #
    #   @brief  Executes a command using the capable adapter.
    #   @param  command             Command to execute
    #   @return                     Adapter result
    #
    ############################################################################
    def execute(self, command):
        adapter_name = self.capability_adapters.get(command.capability)

        if adapter_name is None:
            raise ValueError(
                "No adapter for capability: " + command.capability
            )

        return self.adapters[adapter_name].execute(command)

    ############################################################################
    #
    #   @brief  Returns whether the capability is available.
    #   @param  capability          Capability to look for
    #   @return bool                True when supported
    #
    ############################################################################
    def has_capability(self, capability):
        return capability in self.capability_adapters


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

