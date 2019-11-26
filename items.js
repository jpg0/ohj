const osgi = require('./osgi');
const utils = require('./utils');
const log = require('./log')('items');
const metadata = require('./metadata');
const { UnDefType, events } = require('@runtime/Defaults');

const itemBuilderFactory = osgi.get_service(
    "org.openhab.core.items.ItemBuilderFactory"
) || osgi.get_service(
    "org.eclipse.smarthome.core.items.ItemBuilderFactory"
)

const managedItemProvider = osgi.get_service(
    "org.openhab.core.items.ManagedItemProvider"
) || osgi.get_service(
    "org.eclipse.smarthome.core.items.ManagedItemProvider"
)


const { itemRegistry } = require('@runtime/Defaults');


const DYNAMIC_ITEM_TAG = "_DYNAMIC_";


class OHItem {
    constructor(rawItem) {
        if (typeof rawItem === 'undefined') {
            throw Error("Supplied item is undefined");
        }
        this.rawItem = rawItem;
    }

    get type() {
        return this.rawItem.getClass().getSimpleName();
    }

    get name() {
        return this.rawItem.getName();
    }

    get state() {
        return this.rawState.toString();
    }

    get rawState() {
        return this.rawItem.state;
    }

    get descendents() {
        return utils.javaSetToJsArray(this.rawItem.getAllMembers()).map(raw => new OHItem(raw));
    }

    get isUninitialized() {
        if (this.rawItem.state instanceof UnDefType
            || this.rawItem.state.toString() == "Undefined"
            || this.rawItem.state.toString() == "Uninitialized"
        ) {
            return true;
        } else {
            return false;
        }
    }

    getMetadataValue(namespace) {
        return metadata.getMetadataValue(this.name, namespace);
    }

    sendCommandIfDifferent(value) {
        if(value.toString() != this.state.toString()) {
            this.sendCommand(value);
            return true;
        }

        return false;
    }

    sendCommand(value) {
        events.sendCommand(this.rawItem, value);
        log.debug("Sent command {} to {}", value, this.name);
    }

    postUpdate(value) {
        events.postUpdate(this.rawItem, value);
        log.debug("Posted update {} to {}", value, this.name);
    }
}

/*
    itemName (str): Item name for the Item to create
    itemType (str): (optional) the type of the Item
    category (str): (optional) the category (icon) for the Item
    groups (str): (optional) a list of groups the Item is a member of
    label (str): (optional) the label for the Item
    tags (list): (optional) a list of tags for the Item
    giBaseType (str): (optional) the group Item base type for the Item
    groupFunction (GroupFunction): (optional) the group function used by the Item
        
    returns: the item object, or undefined otherwise  
*/
const addItem = function (itemName, itemType, category, groups, label, tags, giBaseType, groupFunction) {
    var baseItem;
    if (itemType !== 'Group' && typeof (giBaseType) !== 'undefined') {
        baseItem = itemBuilderFactory.newItemBuilder(giBaseType, itemName + "_baseItem").build()
    }
    if (itemType !== 'Group') {
        groupFunction = undefined;
    }

    if (typeof tags === 'undefined') {
        tags = [];
    }

    tags.push(DYNAMIC_ITEM_TAG);

    try {
        var builder = itemBuilderFactory.newItemBuilder(itemType, itemName).
            withCategory(category).
            withLabel(label);

        builder = builder.withTags(utils.jsArrayToJavaSet(tags));

        if (typeof groups !== 'undefined') {
            builder = builder.withGroups(utils.jsArrayToJavaList(groups));
        }

        if (typeof baseItem !== 'undefined') {
            builder = builder.withBaseItem(baseItem);
        }
        if (typeof groupFunction !== 'undefined') {
            builder = builder.withGroupFunction(groupFunction);
        }

        var item = builder.build();

        log.debug("Adding item:" + item);

        managedItemProvider.add(item);

        log.debug("Item added: " + item);

        return new OHItem(item);

    } catch (e) {
        log.error("Failed to add item: " + e);
        throw e;
    }

}

const removeItem = function (itemOrItemName) {

    var itemName;

    if (typeof itemOrItemName === 'string') {
        itemName = itemOrItemName;
    } else if (itemOrItemName.hasOwnProperty('name')) {
        itemName = itemOrItemName.name;
    } else {
        log.warn('Item not registered (or supplied name is not a string) so cannot be removed');
        return null;
    }

    if (typeof getItem(itemName) === 'undefined') {
        log.warn('Item not registered so cannot be removed');
        return null;
    }

    managedItemProvider.remove(itemName);

    if (typeof itemRegistry.getItem(itemName) === 'undefined') {
        log.debug("Item removed: " + itemName);
    } else {
        log.warn("Failed to remove item: " + itemName);
    }
}

const replaceItem = function (/* same args as addItem */) {
    var itemName = arguments[0];
    try {
        var item = getItem(itemName);
        if (typeof item !== 'undefined') {
            log.debug("Removing existing item " + itemName + "[" + item + "] to replace with updated one");
            removeItem(itemName);
        } else { //todo: remove me
            log.debug("Item " + itemName + " undefined");
        }
    } catch (e) {
        if (("" + e).startsWith("org.eclipse.smarthome.core.items.ItemNotFoundException")) {
            // item not present
        } else {
            throw e;
        }
    }

    return addItem.apply(this, arguments);
}

const getItem = (name) => {
    if (typeof name === 'string' || name instanceof String) {
        return new OHItem(itemRegistry.getItem(name));
    }

    throw Error("Failed to get item for " + name);
}

module.exports = {
    getItem,
    addItem,
    replaceItem,
    removeItem,
    safeItemName: s => s.replace(/[^a-zA-Z0-9_]/g, '_')
}