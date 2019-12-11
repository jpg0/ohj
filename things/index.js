const ThingBuilder = Java.type('org.eclipse.smarthome.core.thing.binding.builder.ThingBuilder');
const ThingTypeUID = Java.type('org.eclipse.smarthome.core.thing.ThingTypeUID');

class OHThing {
    constructor(rawThing) {
        this.rawThing = rawThing;
    }
}


let createThing = function(thingTypeUID, thingId, label, location) {
    if(typeof thingTypeUID === 'string') {
        thingTypeUID = new ThingTypeUID(...thingTypeUID.split(':'));
    }

    let builder = ThingBuilder.create(thingTypeUID, thingId);
    label && builder.withLabel(label);
    location && builder.withLocation(location);
    return new OHThing(builder.build());
}



module.exports = {
    createThing,
    provider: require('./thingsprovider')
}