const ohitems = require('./items');

const PersistenceExtensions = Java.type("org.eclipse.smarthome.model.persistence.extensions.PersistenceExtensions");


exports.historicState = function (item, timestamp) {
    //todo: check item param
    let history = PersistenceExtensions.historicState(item.rawItem, timestamp);
    
    return history === null ? null : history.state;
};