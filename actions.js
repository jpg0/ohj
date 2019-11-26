
    
    const osgi = require('./osgi');
    const utils = require('./util');

    const oh1_actions = osgi.find_services("org.openhab.core.scriptengine.action.ActionService", null) || [];
    const oh2_actions = osgi.find_services("org.eclipse.smarthome.model.script.engine.action.ActionService", null) || [];

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