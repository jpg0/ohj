
var HashSet = Java.type("java.util.HashSet");
var ArrayList = Java.type("java.util.ArrayList");

exports.jsArrayToJavaSet = function (arr) {
    let set = new HashSet();

    for (let i of arr) {
        set.add(i);
    }

    return set;
};

exports.jsArrayToJavaList = function (arr) {
    let list = new ArrayList();

    for (let i of arr) {
        list.add(i);
    }

    return list;
}

exports.javaSetToJsArray = function(set) {
    return Java.from(new ArrayList(set));
}

exports.randomUUID = () => Java.type("java.util.UUID").randomUUID();

exports.dumpObject = function (obj) {
    try {
        log.info("Dumping object...");
        log.info("  typeof obj = {}", (typeof obj));
        let isJavaObject = Java.isJavaObject(obj);
        log.info("  Java.isJavaObject(obj) = {}", isJavaObject)
        let isJavaType = Java.isType(obj);
        log.info("  Java.isType(obj) = {}", isJavaType)
        if (isJavaObject) {
            if (isJavaType) {
                log.info("  Java.typeName(obj) = {}", Java.typeName(obj));
            } else {
                log.info("  Java.typeName(obj.class) = {}", Java.typeName(obj.class));
                if(Java.typeName(obj.class) == 'java.util.HashMap'){
                    log.info("Dumping contents...");
                    let keys = obj.keySet().toArray();
                    for (var key in keys) {
                        log.info(`${keys[key]}(${typeof keys[key]}) = ${obj.get(keys[key])}(${typeof obj.get(keys[key])})`);
                        if(typeof keys[key] === 'object') {
                            log.info("Dumping key...");
                            exports.dumpObject(keys[key]);
                        }
                    }
                }
            }
        }

        log.info("Object.getOwnPropertyNames(obj) = {}", Object.getOwnPropertyNames(obj));
        // log.info("obj.toString() = {}", obj.toString());
        // log.info("JSON.stringify(obj) = {}", JSON.stringify(obj));
    } catch(e) {
        log.info("Failed to dump object: " + e.message);
    }
}

exports.typeWithFallback = function(type, fallbackType) {
    let rv;
    try {
        rv = Java.type(type);
    } catch(e) {
        rv = Java.type(fallbackType);
    }
    return rv;
}