/**
 * Items namespace.
 * This namespace handles querying and updating Openhab Items.
 * @namespace items
 */

const osgi = require('./osgi');
const utils = require('./utils');
const log = require('./log')('items');
const metadata = require('./metadata');
const { UnDefType, events, itemRegistry } = require('@runtime/Defaults');

const itemBuilderFactory = osgi.getService(
    "org.openhab.core.items.ItemBuilderFactory",
    "org.eclipse.smarthome.core.items.ItemBuilderFactory"
);

const managedItemProvider = osgi.getService(
    "org.openhab.core.items.ManagedItemProvider",
    "org.eclipse.smarthome.core.items.ManagedItemProvider"
);

/**
 * Tag value to be attached to all dynamically created items.
 * @memberOf items
 */
const DYNAMIC_ITEM_TAG = "_DYNAMIC_";

/**
 * Class representing an Openhab Item
 * @memberOf items
 */
class OHItem {
    /**
     * Create an OHItem, wrapping a native Java Openhab Item. Don't use this constructor, instead call {@link getItem}.
     * @param {HostItem} rawItem Java Item from Host
     * @hideconstructor
     */
    constructor(rawItem) {
        if (typeof rawItem === 'undefined') {
            throw Error("Supplied item is undefined");
        }
        this.rawItem = rawItem;
    }

    /**
     * The type of the item: the Simple (without package) name of the Java item type, such as 'Switch'.
     * @return {String} the type
     */
    get type() {
        return this.rawItem.getClass().getSimpleName();
    }

    /**
     * The name of the item.
     * @return {String} the name
     */
    get name() {
        return this.rawItem.getName();
    }

    /**
     * The state of the item, as a string.
     * @return {String} the item's state
     */
    get state() {
        return this.rawState.toString();
    }

    /**
     * The raw state of the item, as a java object.
     * @return {HostState} the item's state
     */
    get rawState() {
        return this.rawItem.state;
    }

    /**
     * All descendents of the current group item (as returned by 'getAllMembers()'). Must be a group item.
     * @returns {OHItem[]} all descendent items
     */
    get descendents() {
        return utils.javaSetToJsArray(this.rawItem.getAllMembers()).map(raw => new OHItem(raw));
    }

    /**
     * Whether this item is initialized.
     * @type {Boolean}
     * @returns true iff the item has not been initialized
     */
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

    /**
     * Gets metadata values for this item.
     * @param {String} namespace The namespace for the metadata to retreive
     * @returns {String} the metadata associated with the item
     */
    getMetadataValue(namespace) {
        return metadata.getMetadataValue(this.name, namespace);
    }

    /**
     * Sends a command to the item
     * @param {String|HostState} value the value of the command to send, such as 'ON'
     * @see sendCommandIfDifferent
     * @see postUpdate
     */
    sendCommand(value) {
        log.debug("Sending command {} to {}", value, this.name);
        events.sendCommand(this.rawItem, value);
    }

    /**
     * Sends a command to the item, but only if the current state is not what is being sent.
     * Note
     * @param {String|HostState} value the value of the command to send, such as 'ON'
     * @returns {Boolean} true if the command was sent, false otherwise
     * @see sendCommand
     */
    sendCommandIfDifferent(value) {
        if(value.toString() != this.state.toString()) {
            this.sendCommand(value);
            return true;
        }

        return false;
    }

    /**
     * Posts an update to the item
     * @param {String|HostState} value the value of the command to send, such as 'ON'
     * @see sendCommand
     */
    postUpdate(value) {
        events.postUpdate(this.rawItem, value);
        log.debug("Posted update {} to {}", value, this.name);
    }
}

/**
 * Creates a new item within OpenHab. This item will persist regardless of the lifecycle of the script creating it.
 * 
 * Note that all items created this way have an additional tag attached, for simpler retrieval later. This tag is
 * created with the value {@link DYNAMIC_ITEM_TAG}.
 * 
 * @memberOf items
 * @param {String} itemName Item name for the Item to create
 * @param {String} [itemType] the type of the Item
 * @param {String} [category] the category (icon) for the Item
 * @param {String[]} [groups] an array of groups the Item is a member of
 * @param {String} [label] the label for the Item
 * @param {String[]} [tags] an array of tags for the Item
 * @param {HostItem} [giBaseType] the group Item base type for the Item
 * @param {HostGroupFunction} [groupFunction] the group function used by the Item
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

/**
 * Removes an item from OpenHab. The item is removed immediately and cannot be recoved.
 * 
 * @memberOf items
 * @param {String|HostItem} itemOrItemName the item to remove
 * @returns {Boolean} true iff the item is actually removed
 */
const removeItem = function (itemOrItemName) {

    var itemName;

    if (typeof itemOrItemName === 'string') {
        itemName = itemOrItemName;
    } else if (itemOrItemName.hasOwnProperty('name')) {
        itemName = itemOrItemName.name;
    } else {
        log.warn('Item not registered (or supplied name is not a string) so cannot be removed');
        return false;
    }

    if (typeof getItem(itemName) === 'undefined') {
        log.warn('Item not registered so cannot be removed');
        return false;
    }

    managedItemProvider.remove(itemName);

    if (typeof itemRegistry.getItem(itemName) === 'undefined') {
        log.debug("Item removed: " + itemName);
        return true;
    } else {
        log.warn("Failed to remove item: " + itemName);
        return false;
    }
}

/**
 * Replaces (upserts) an item. If an item exists with the same name, it will be removed and a new item with
 * the supplied parameters will be created in it's place. If an item does not exist with this name, a new
 * item will be created with the supplied parameters.
 * 
 * This function can be useful in scripts which create a static set of items which may need updating either
 * periodically, during startup or even during development of the script. Using fixed item names will ensure
 * that the items remain up-to-date, but won't fail with issues related to duplicate items.
 * 
 * @param {String} itemName Item name for the Item to create
 * @param {String} [itemType] the type of the Item
 * @param {String} [category] the category (icon) for the Item
 * @param {String[]} [groups] an array of groups the Item is a member of
 * @param {String} [label] the label for the Item
 * @param {String[]} [tags] an array of tags for the Item
 * @param {HostItem} [giBaseType] the group Item base type for the Item
 * @param {HostGroupFunction} [groupFunction] the group function used by the Item
 */
/* above params copied from addItem */
const replaceItem = function (/* same args as addItem */) {
    var itemName = arguments[0];
    try {
        var item = getItem(itemName);
        if (typeof item !== 'undefined') {
            log.debug("Removing existing item " + itemName + "[" + item + "] to replace with updated one");
            removeItem(itemName);
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

/**
 * Gets an Openhab Item.
 * @param {String} name the name of the item
 * @return {OHItem} the item
 * @alias module:ohj/items.getItem
 */
const getItem = (name) => {
    if (typeof name === 'string' || name instanceof String) {
        return new OHItem(itemRegistry.getItem(name));
    }

    throw Error("Failed to get item named: " + name);
}

module.exports = {
    getItem,
    addItem,
    replaceItem,
    removeItem,
    /**
     * Helper function to ensure an item name is valid. All invalid characters are replaced with an underscore.
     * @param {String} s the name to make value
     * @returns {String} a valid item name
     */
    safeItemName: s => s.replace(/[^a-zA-Z0-9_]/g, '_')
}