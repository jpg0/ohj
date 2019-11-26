const triggers = require('../triggers');
const log = require('../log')('trigger-conf');

class CronTriggerConfig {
    constructor(timeStr) {
        this.timeStr = timeStr;
        this._complete = () => true
        this._toOHTriggers = () => [triggers.GenericCronTrigger(this.timeStr)]
        this.describe = () => `matches cron "${this.timeStr}"`
    }
};


class ItemTriggerConfig {
    constructor(item_name) {
        this.item_name = item_name;
        this.describe = () => `item ${this.item_name} changed`
        this.of = this.to; //receivedCommand().of(..)
    }

    to(value) {
        this.to_value = value;
        return this;
    }

    toOff() {
        return this.to('OFF');
    }

    toOn() {
        return this.to('ON');
    }

    receivedCommand() {
        this.op_type = 'receivedCommand';
        return this;
    }

    receivedUpdate() {
        this.op_type = 'receivedUpdate';
        return this;
    }

    changed() {
        this.op_type = 'changed';
        return this;
    }

    _complete() {
        return typeof (this.op_type) !== 'undefined';
    }

    describe() {
        switch (this.op_type) {
            case "changed":
                let desc = `item ${this.item_name} changed`;
                if (this.to_value) {
                    desc += ` to ${this.to_value}`;
                }
                return desc;
            case "receivedCommand":
                    return `item ${this.item_name} received command`;
            case "receivedUpdate":
                    return `item ${this.item_name} received update`;
            default:
                throw error("Unknown operation type: " + this.op_type);
        }
    }

    for(timespan) {
        return new TimingItemStateOperation(this, timespan);
    }

    _toOHTriggers() {
        switch (this.op_type) {
            case "changed":
                return [triggers.ItemStateChangeTrigger(this.item_name, undefined, this.to_value)];
            case 'receivedCommand':
                return [triggers.ItemCommandTrigger(this.item_name, this.to_value)]
            case 'receivedUpdate':
                return [triggers.ItemStateUpdateTrigger(this.item_name, this.to_value)]
            default:
                throw error("Unknown operation type: " + this.op_type);
        }
    }

    _executeHook() {

        const getReceivedCommand = function(args){
            return args.receivedCommand;
        };

        if(this.op_type === 'receivedCommand') { //add the received command as 'it'
            return function(next, args){
                let it = getReceivedCommand(args);
                return next({
                    ...args,
                    it
                });
            }
        } else {
            return null;
        }
    }
}

module.exports = {
    ItemTriggerConfig,
    CronTriggerConfig
}