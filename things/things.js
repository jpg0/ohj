const JavaThingBuilder = Java.type('org.eclipse.smarthome.core.thing.binding.builder.ThingBuilder');
const ThingTypeUID = Java.type('org.eclipse.smarthome.core.thing.ThingTypeUID');
const ChannelBuilder = Java.type('org.eclipse.smarthome.core.thing.binding.builder.ChannelBuilder');
const ChannelUID = Java.type('org.eclipse.smarthome.core.thing.ChannelUID');
const ThingUID = Java.type('org.eclipse.smarthome.core.thing.ThingUID');


class OHThing {
    constructor(rawThing) {
        this.rawThing = rawThing;
    }
}

class OHChannel {
    constructor(rawChannel) {
        this.rawChannel = rawChannel;
    }

    get uid(){
        return this.rawChannel.getUID().toString();
    }
}

class ThingBuilder {
    constructor(thingTypeUID, thingId, bridgeUID) {
        if(typeof thingTypeUID === 'string') {
            thingTypeUID = new ThingTypeUID(...thingTypeUID.split(':'));
        }

        this.thingTypeUID = thingTypeUID;
        this.thingUID = new ThingUID(thingTypeUID.getBindingId(), thingTypeUID.getId(), thingId)
        this.thingId = thingId;
        this.rawBuilder = JavaThingBuilder.create(thingTypeUID, this.thingUID);

        if(typeof bridgeUID !== 'undefined') {
            if(typeof bridgeUID === 'string') {
                let [bridgeBindingId, bridgeThingTypeId, bringThingId] = bridgeUID.split(':');
                bridgeUID = new ThingUID(new ThingTypeUID(bridgeBindingId, bridgeThingTypeId), bringThingId);
            }
            this.rawBuilder.withBridge(bridgeUID);
        }
    }

    withChannel(channel) {
        this.rawBuilder.withChannel(channel.rawChannel);
        return this;
    }

    withLabel(label) {
        this.rawBuilder.withLabel(label);
        return this;
    }

    build() {
        return new OHThing(this.rawBuilder.build());
    }
}



let createChannel = function(thingUID, channelId, acceptedItemType, properties){
    let channelUID = new ChannelUID(thingUID, channelId);
    let builder = ChannelBuilder.create(channelUID, acceptedItemType);
    builder.withProperties(properties);
    return new OHChannel(builder.build());
}


module.exports = {
    newThingBuilder: (thingTypeUID, id, bridgeUID) => new ThingBuilder(thingTypeUID, id, bridgeUID),
    createChannel
}