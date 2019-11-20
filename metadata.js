const osgi = require('./osgi');

let MetadataRegistry;
let Metadata;
let MetadataKey;

try {
    MetadataRegistry = osgi.get_service("org.openhab.core.items.MetadataRegistry");
    if(MetadataRegistry === null) {
        throw error("not found");
    }
} catch(e) {
    MetadataRegistry =  osgi.get_service("org.eclipse.smarthome.core.items.MetadataRegistry");
}

try {
    Metadata = Java.type("org.openhab.core.items.Metadata");
    MetadataKey = Java.type("org.openhab.core.items.MetadataKey");
} catch(e) {
    Metadata = Java.type("org.eclipse.smarthome.core.items.Metadata");
    MetadataKey = Java.type("org.eclipse.smarthome.core.items.MetadataKey");
}

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