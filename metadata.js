/**
 * Items' metadata namespace.
 * This namespace provides access to metadata on items.
 * 
 * @private
 * @namespace metadata
 */

const osgi = require('./osgi');
const utils = require('./utils');

let MetadataRegistry = osgi.getService("org.openhab.core.items.MetadataRegistry", "org.eclipse.smarthome.core.items.MetadataRegistry");
let Metadata = utils.typeWithFallback("org.openhab.core.items.Metadata", "org.eclipse.smarthome.core.items.Metadata");
let MetadataKey = utils.typeWithFallback("org.openhab.core.items.MetadataKey", "org.eclipse.smarthome.core.items.MetadataKey");


/**
 * This function will return the Metadata object associated with the
 * specified Item.
 * 
 * @memberof metadata
 * @param {String} name of the Item
 * @param {String} namespace name of the namespace
 * @returns {String|null} the metadata as a string, or null
 */
exports.getMetadataValue = function(itemName, namespace) {
    let metadata = MetadataRegistry.get(new MetadataKey(namespace, itemName));
    return metadata ? metadata.value : null;
};