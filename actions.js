/**
 * Actions namespace.
 * This namespace provides access to Openhab actions. All available actions can be accessed as direct properties of this
 * object (via their simple class name).
 * 
 * @example <caption>Sends a broadcast notification</caption>
 * let { actions } = require('ohj');
 * actions.NotificationAction.sendBroadcastNotification("Hello World!")
 * 
 * @example <caption>Sends a PushSafer notification</caption>
 * let { actions } = require('ohj');
 *  actions.Pushsafer.pushsafer("<your pushsafer api key>", "<message>", "<message title>", "", "", "", "")
 * 
 * @namespace actions
 */



const osgi = require('./osgi');
const utils = require('./utils');

const oh1_actions = osgi.findServices("org.openhab.core.scriptengine.action.ActionService", null) || [];
const oh2_actions = osgi.findServices("org.eclipse.smarthome.model.script.engine.action.ActionService", null) || [];

oh1_actions.concat(oh2_actions).forEach(function (item) {
    exports[item.getActionClass().getSimpleName()] = item.getActionClass().static;
});

let Exec = utils.typeWithFallback('org.openhab.core.model.script.actions.Exec', 'org.eclipse.smarthome.model.script.actions.Exec');
let HTTP = utils.typeWithFallback('org.openhab.core.model.script.actions.HTTP', 'org.eclipse.smarthome.model.script.actions.HTTP');
let LogAction = utils.typeWithFallback('org.openhab.core.model.script.actions.LogAction', 'org.eclipse.smarthome.model.script.actions.LogAction');
let Ping = utils.typeWithFallback('org.openhab.core.model.script.actions.Ping', 'org.eclipse.smarthome.model.script.actions.Ping');

[Exec, HTTP, LogAction, Ping].forEach(function (item) {
    exports[item.class.getSimpleName()] = item.class.static;
});