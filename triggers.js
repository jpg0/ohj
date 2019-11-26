const utils = require('./utils');

let ModuleBuilder = utils.typeWithFallback(
    "org.eclipse.smarthome.automation.core.util.ModuleBuilder",
    "org.openhab.core.automation.util.ModuleBuilder");

let Configuration = Java.type("org.eclipse.smarthome.config.core.Configuration");

let createTrigger = function(typeString, name, config) {
    if(typeof name === 'undefined' || name === null) {
        name = utils.randomUUID().toString();
    }

    return ModuleBuilder.createTrigger()
        .withId(name)
        .withTypeUID(typeString)
        .withConfiguration(new Configuration(config))
        .build();
}

module.exports = {

    // Works like: ChannelEventTrigger('astro:sun:local:rise#event', 'START')
    ChannelEventTrigger: (channel, event, triggerName) => createTrigger("core.ChannelEventTrigger", triggerName, {
        "channelUID": channel,
        "event": event
    }),

    ItemStateChangeTrigger: (itemName, oldState, newState, triggerName) => createTrigger("core.ItemStateChangeTrigger", triggerName, {
        "itemName": itemName,
        "state": newState,
        "oldState": oldState
    }),

    ItemStateUpdateTrigger: (itemName, state, triggerName) => createTrigger("core.ItemStateUpdateTrigger", triggerName, {
            "itemName": itemName,
            "state": state
    }),    

    ItemCommandTrigger: (itemName, command, triggerName) => createTrigger("core.ItemCommandTrigger", triggerName, {
        "itemName": itemName,
        "command": command
    }),    

    GenericCronTrigger: (expression, triggerName) => createTrigger("timer.GenericCronTrigger", triggerName, {
        "cronExpression": expression
    }),    
    TimerTrigger: this.GenericCronTrigger,

    TimeOfDayTrigger: (time, triggerName) => createTrigger("timer.TimeOfDayTrigger", triggerName, {
        "time": time
    }),    

    ItemStateCondition: (itemName, state, condName) => createTrigger("core.ItemStateCondition", triggerName, {
        "itemName": itemName,
        "operator": "=",
        "state": state
    }),
 
    GenericCompareCondition: (itemName, state, operator, condName) => createTrigger("core.GenericCompareCondition", triggerName, {
            "itemName": itemName,
            "operator": operator,// matches, ==, <, >, =<, =>
            "state": state
    })
}