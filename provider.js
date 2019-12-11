const osgi = require('./osgi');

class AbstractProvider {
    constructor(typeName) {
        this.javaType = Java.extend(Java.type(typeName));
        this.typeName = typeName;
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
        osgi.unregisterService(this.hostProvider);
    }
}

module.exports = {
    AbstractProvider
}