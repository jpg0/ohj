/**
 * OSGi module.
 * This module provides access to OSGi services.
 * 
 * @namespace osgi
 */

const FrameworkUtil = Java.type("org.osgi.framework.FrameworkUtil");
const bundle = FrameworkUtil.getBundle(Java.type("org.openhab.core.automation.module.script.ScriptExtensionProvider"));
const bundleContext = (bundle !== null) ? bundle.getBundleContext() : null;

/**
 * Gets a service registered with OSGi.
 * 
 * @private
 * @param {String|HostClass} class_or_name the class of the service to get
 * @returns an instance of the service, or null if it cannot be found
 * @memberOf osgi
 */
let lookupService = function (class_or_name) {
    if (bundleContext !== null) {
        var classname = (typeof class_or_name === "object") ? class_or_name.getName() : class_or_name;
        var ref = bundleContext.getServiceReference(classname);
        return (ref !== null) ? bundleContext.getService(ref) : null;
    }
}

/**
 * Gets a service registered with OSGi. Allows providing multiple classes/names to try for lookup.
 * 
 * @param {Array<String|HostClass>} class_or_names the class of the service to get
 * 
 * @returns an instance of the service, or null if it cannot be found
 * @memberOf osgi
 */
let getService = function (...class_or_names) {

    let rv = null;

    for(let class_or_name of class_or_names) {
        try {
            rv = lookupService(class_or_name)
        } catch(e) {}

        if(typeof rv !== 'undefined' || rv != null) {
            return rv;
        }
    }

    return rv;
}

/**
 * Finds services registered with OSGi.
 * 
 * @param {String} class_name the class of the service to get
 * @param {*} [filter] an optional filter used to filter the returned services
 * @returns {Object[]} any instances of the service that can be found
 * @memberOf osgi
 */
let findServices = function (class_name, filter) {
    if (bundleContext !== null) {
        var refs = bundleContext.getAllServiceReferences(class_name, filter);
        if (refs !== null) {
            var services = [];
            for (var i = 0, size = refs.length; i < size; i++) {
                services.push(bundleContext.getService(refs[i]));
            }
            return services;
        }
    }
}

exports = {
    getService,
    findServices
}