const osgi = require('./osgi');
const log = require('./log')('provider');
const utils = require('./utils');

function getAllFunctionNames(obj) {
    var props = [];
    var o = obj;
    do {
        props = props.concat(Object.getOwnPropertyNames(o));
        o = Object.getPrototypeOf(o);
    } while (o.constructor.name !== 'AbstractProvider');

    return props.filter(p => typeof obj[p] === 'function');
}

class AbstractProvider {
    constructor(type) {
        this.typeName = type.class.getName();
        this.javaType = require('@runtime/osgi').classutil.extend(type);
    }

    register() {
        let javaConfig = {};

        let functionNamesToBind = getAllFunctionNames(this).
            filter(f => f !== 'constructor').
            filter(f => f !== 'javaType');

        for(let fn of functionNamesToBind) {
            javaConfig[fn] = this[fn].bind(this);
        }
    
        let hostProvider = new this.javaType(javaConfig);

        this.hostProvider = hostProvider;

        require('@runtime/osgi').lifecycle.addDisposeHook(this.unregister.bind(this));
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

class StateDescriptionFragmentProvider extends AbstractProvider {
    constructor() {
        super(utils.typeBySuffix('core.types.StateDescriptionFragmentProvider'));
        this.callbacks = [];
    }

    addCallback(callback) {
        this.callbacks.push(callback);
    }

    getStateDescriptionFragment(itemName, locale) {
        for(let c of this.callbacks) {
            let result = c(itemName, locale);
            if(typeof result !== 'undefined') {
                return result;
            }
        }

        return null;
    }

    getRank() {
        return 0;
    }

}

let ItemChannelLinkProviderClass = utils.typeBySuffix('core.thing.link.ItemChannelLinkProvider');
let MetadataProviderClass = utils.typeBySuffix('core.items.MetadataProvider');
let ItemProviderClass = utils.typeBySuffix('core.items.ItemProvider');
let ThingProviderClass = utils.typeBySuffix('core.thing.ThingProvider');

module.exports = {
    AbstractProvider,
    newCallbackItemChannelLinkProvider: () => new CallbackProvider(ItemChannelLinkProviderClass),
    newCallbackMetadataProvider: () => new CallbackProvider(MetadataProviderClass),
    newCallbackItemProvider: () => new CallbackProvider(ItemProviderClass),
    newCallbackThingProvider: () => new CallbackProvider(ThingProviderClass),
    newCallbackStateDescriptionFragmentProvider: () => new StateDescriptionFragmentProvider
}