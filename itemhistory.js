/**
 * Items' history module.
 * This module provides access to historic state of items.
 * 
 * @private
 * @namespace itemshistory
 */

const PersistenceExtensions = Java.type("org.eclipse.smarthome.model.persistence.extensions.PersistenceExtensions");


exports.historicState = function (item, timestamp) {
    //todo: check item param
    let history = PersistenceExtensions.historicState(item.rawItem, timestamp);
    
    return history === null ? null : history.state;
};