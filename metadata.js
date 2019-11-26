const osgi = require('./osgi');
const utils = require('./utils');

let MetadataRegistry;

try {
    MetadataRegistry = osgi.get_service("org.openhab.core.items.MetadataRegistry");
    if(MetadataRegistry === null) {
        throw error("not found");
    }
} catch(e) {
    MetadataRegistry =  osgi.get_service("org.eclipse.smarthome.core.items.MetadataRegistry");
}

let Metadata = utils.typeWithFallback("org.openhab.core.items.Metadata",
    "org.eclipse.smarthome.core.items.Metadata");
let MetadataKey = utils.typeWithFallback("org.openhab.core.items.MetadataKey",
    "org.eclipse.smarthome.core.items.MetadataKey");

exports.getMetadataValue = function(item_name, namespace) {
    /*
    This function will return the Metadata object associated with the
    specified Item.

    Args:
        item_name (string): name of the Item
        namespace (string): name of the namespace

    Returns:
        Metadata object: contains the namespace ``value`` and
            ``configuration`` dictionary
        null: metadata or Item does not exist
    */
    let metadata = MetadataRegistry.get(new MetadataKey(namespace, item_name));

    return metadata ? metadata.value : null;
};