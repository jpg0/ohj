/**
 * Items' history module.
 * This module provides access to historic state of items.
 * 
 * @private
 * @namespace itemshistory
 */

const utils = require('./utils');

const PersistenceExtensions = utils.typeBySuffix("model.persistence.extensions.PersistenceExtensions");
const Instant = Java.type('java.time.Instant');

let historicState = function (item, timestamp) {
    //todo: check item param
    let history = PersistenceExtensions.historicState(item.rawItem, timestamp);
    
    return history === null ? null : history.state;
};

let previousState = function(item, skipEqual = false) {
    let result = PersistenceExtensions.previousState(item.rawItem, skipEqual)

    return result === null ? null : result.state;
}

let latestState = (item) => historicState(item, Instant.now());

module.exports = {
    historicState,
    latestState,
    previousState
}