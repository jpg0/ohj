/**
 * Items namespace.
 * This namespace handles querying and updating Openhab Items.
 * @namespace items
 */

module.exports = {
    ...require('./managed'),
    /**
     * Helper function to ensure an item name is valid. All invalid characters are replaced with an underscore.
     * @param {String} s the name to make value
     * @returns {String} a valid item name
     */
    safeItemName: s => s.replace(/[^a-zA-Z0-9_]/g, '_'),
    
    provider: require('./items-provider')
}