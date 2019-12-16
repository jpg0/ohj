/**
 * @typedef {Object} HostState Native Java Openhab State (instance of org.openhab.core.types.State)
 * @typedef {Object} HostItem Native Java Openhab Item (instance of org.openhab.core.items.Item)
 * @typedef {Object} HostClass Native Java Class Object (instance of java.lang.Class)
 * @typedef {Object} HostRule Native Jave Openhab Rule (instance of org.openhab.core.automation.Rule)
 * @typedef {Object} HostTrigger Native Jave Openhab Trigger (instance of org.openhab.core.automation.Trigger)
 */

module.exports = {
    log: require('./log'),
    fluent: require('./fluent'),
    rules: require('./rules'),
    items: require('./items'),
    things: require('./things'),
    metadata: require('./metadata'),
    triggers: require('./triggers'),
    actions: require('./actions'),
    utils: require('./utils'),
    osgi: require('./osgi'),
    provider: require('./provider'),
    itemchannellink: require('./itemchannellink')
}