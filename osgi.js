/**
 * OSGi module.
 * This module provides access to OSGi services.
 * 
 * @namespace osgi
 */

const log = require('./log')('osgi');

const FrameworkUtil = Java.type("org.osgi.framework.FrameworkUtil");
const bundle = FrameworkUtil.getBundle(Java.type("org.openhab.core.automation.module.script.ScriptExtensionProvider"));
const bundleContext = (bundle !== null) ? bundle.getBundleContext() : null;

/**
 * Map of interface names to sets of services registered (by this module)
 */
let registeredServices = {};

/**
 * Gets a service registered with OSGi.
 * 
 * @private
 * @param {String|HostClass} classOrName the class of the service to get
 * @returns an instance of the service, or null if it cannot be found
 * @memberOf osgi
 */
let lookupService = function (classOrName) {
    if (bundleContext !== null) {
        var classname = (typeof classOrName === "object") ? classOrName.getName() : classOrName;
        var ref = bundleContext.getServiceReference(classname);
        return (ref !== null) ? bundleContext.getService(ref) : null;
    }
}

/**
 * Gets a service registered with OSGi. Allows providing multiple classes/names to try for lookup.
 * 
 * @param {Array<String|HostClass>} classOrNames the class of the service to get
 * 
 * @returns an instance of the service, or null if it cannot be found
 * @throws {Error} if no services of the requested type(s) can be found
 * @memberOf osgi
 */
let getService = function (...classOrNames) {

    let rv = null;

    for(let classOrName of classOrNames) {
        try {
            rv = lookupService(classOrName)
        } catch(e) {}

        if(typeof rv !== 'undefined' && rv !== null) {
            return rv;
        }
    }

    throw Error(`Failed to get any services of type(s): ${classOrNames}`);
}

/**
 * Finds services registered with OSGi.
 * 
 * @param {String} className the class of the service to get
 * @param {*} [filter] an optional filter used to filter the returned services
 * @returns {Object[]} any instances of the service that can be found
 * @memberOf osgi
 */
let findServices = function (className, filter) {
    if (bundleContext !== null) {
        var refs = bundleContext.getAllServiceReferences(className, filter);
        return refs != null ? [...refs].map(ref => bundleContext.getService(ref)) : null;
    }
}

let registerService = function(service, interfaceNames) {
    let registration = bundleContext.registerService(interfaceNames, service, null);
    for (let interfaceName of interfaceNames) {
        if(typeof registeredServices[interfaceName] === 'undefined') {
            registeredServices[interfaceName] = new Set();
        }
        registeredServices[interfaceName].add({service, registration});
    }
    return registration;
}

let unregisterService = function(serviceToUnregister) {
    for(let servicesForInterface of registeredServices) {
        servicesForInterface.forEach(({service, registration}) => {
            if (service == serviceToUnregister) {
                servicesForInterface.delete({service, registration});
                registration.unregister();
            }
        });
    }
}

module.exports = {
    getService,
    findServices,
    registerService,
    unregisterService
}