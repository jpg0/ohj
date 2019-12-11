const { AbstractProvider } = require('../provider');

const THING_PROVIDER_CLASS = "org.eclipse.smarthome.core.thing.ThingProvider";

class StaticCallbackThingProvider extends AbstractProvider {
    constructor(){
        super(THING_PROVIDER_CLASS);
        this.thingsCallbacks = [];
    }

    addProviderChangeListener(listener) {
    }

    removeProviderChangeListener(listener) {
    }

    addThingsCallback(callback) {
        this.thingsCallbacks.push(callback);
    }

    getAll(){
        return utils.jsArrayToJavaList(this.thingsCallbacks.flatMap(c => c()));
    }
}

module.exports = {
    staticCallbackThingProvider: () => new StaticCallbackThingProvider()
}