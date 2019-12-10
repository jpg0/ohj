const osgi = require('../osgi');
const items = require('./managed');
const utils = require('../utils');

const ITEM_PROVIDER_CLASS = "org.eclipse.smarthome.core.items.ItemProvider";

let JSItemsProviderType = Java.extend(Java.type(ITEM_PROVIDER_CLASS));

class AbstractJSItemsProvider {
    constructor() {
        require('@runtime').lifecycleTracker.addDisposeHook(this.unregister.bind(this));
    }

    register() {
        let hostProvider = new JSItemsProviderType({
            addProviderChangeListener: this.addProviderChangeListener.bind(this),
            removeProviderChangeListener: this.removeProviderChangeListener.bind(this),
            getAll: this.getAll.bind(this)
        });

        this.hostProvider = hostProvider;

        osgi.registerService(hostProvider, ITEM_PROVIDER_CLASS);
    }

    unregister() {
        osgi.unregisterService(this.hostProvider);
    }
}

class StaticJSItemsProvider {
    constructor(items) {
        this.super();
        this.items = items;
        this.registerService();
    }

    addProviderChangeListener(listener) {
    }

    removeProviderChangeListener(listener) {
    }

    getAll(){
        return this.items;
    }
}


class ManagedJSItemsProvider extends AbstractJSItemsProvider {
    constructor() {
        super();
        this.items = new Set();
        this.listeners = new Set();
        this.registerService();
    }

    addProviderChangeListener(listener) {
        this.listeners.add(listener)
    }

    removeProviderChangeListener(listener) {
        this.listeners.delete(listener);
    }

    add(item) {
        if (item instanceof items.OHItem) {
            item = item.rawItem;
        }

        if (!this.items.has(item)) {
            this.items.add(item);
            for (let listener of this.listeners) {
                listener.added(this.hostProvider, item);
            }
        }
    }

    remove(itemOrName) {
        if (typeof itemOrName === 'string') {
            this.items.forEach(i => { if (i.name === itemOrName) this.remove(i) });
        } else {
            if (itemOrName instanceof items.OHItem) {
                itemOrName = itemOrName.rawItem;
            }

            if (this.items.has(itemOrName)) {
                this.items.delete(itemOrName);

                for (let listener of this.listeners) {
                    listener.removed(this.hostProvider, item);
                }
            }
        }
    }

    update(item) {
        if (item instanceof items.OHItem) {
            item = item.rawItem;
        }

        for (let listener of this.listeners) {
            listener.updated(this.hostProvider, item);
        }
    }

    getAll() {
        return utils.jsSetToJavaSet(this.items);
    }
}

module.exports = {
    staticItemsProvider: items => new StaticJSItemsProvider(items),
    managedItemsProvider: () => new ManagedJSItemsProvider()
}
    