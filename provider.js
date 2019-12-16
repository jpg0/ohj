const osgi = require('./osgi');
const log = require('./log')('provider');
const utils = require('./utils');

class AbstractProvider {
    constructor(type) {
        this.typeName = type.class.getName();
        this.javaType = Java.extend(type);
    }

    register() {
        let hostProvider = new this.javaType({
            addProviderChangeListener: this.addProviderChangeListener.bind(this),
            removeProviderChangeListener: this.removeProviderChangeListener.bind(this),
            getAll: this.getAll.bind(this)
        });

        this.hostProvider = hostProvider;

        require('@runtime').lifecycleTracker.addDisposeHook(this.unregister.bind(this));
        osgi.registerService(hostProvider, this.typeName);
    }

    unregister() {
        log.debug("Unregistering service of type {}", this.typeName);
        osgi.unregisterService(this.hostProvider);
    }
}

class CallbackProvider extends AbstractProvider {
    constructor(type){
        super(type);
        this.callbacks = [];
    }

    addProviderChangeListener(listener) {
    }

    removeProviderChangeListener(listener) {
    }

    addCallback(callback) {
        this.callbacks.push(callback);
    }

    getAll(){
        return utils.jsArrayToJavaList(this.callbacks.flatMap(c => c()));
    }
}

let ItemChannelLinkProvider = utils.typeBySuffix('core.thing.link.ItemChannelLinkProvider');
let MetadataProvider = utils.typeBySuffix('core.items.MetadataProvider');
let ItemProvider = utils.typeBySuffix('core.items.ItemProvider');
let ThingProvider = utils.typeBySuffix('core.thing.ThingProvider');

module.exports = {
    AbstractProvider,
    newCallbackItemChannelLinkProvider: () => new CallbackProvider(ItemChannelLinkProvider),
    newCallbackMetadataProvider: () => new CallbackProvider(MetadataProvider),
    newCallbackItemProvider: () => new CallbackProvider(ItemProvider),
    newCallbackThingProvider: () => new CallbackProvider(ThingProvider),
}