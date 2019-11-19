const parse_duration = require('parse-duration');
const log = require('log').Logger('operation-conf');
const ohitems = require('../items');

class CopyStateOperation {
    constructor(send) {
        this.send = send;
    }

    fromItem(item_name){
        this.from_item = item_name;
        return this;
    }

    toItem(item_name){
        this.to_item = item_name;
        return this;
    }

    and(next) {
        this.next = next;
        return this;
    }
    
    _run(args){

        if(typeof this.from_item === 'undefined' || this.from_item === null) {
            throw Error("From item not set");
        }

        if(typeof this.to_item === 'undefined' || this.to_item === null) {
            throw Error("To item not set");
        }

        let from = ohitems.getItem(this.from_item);
        if(typeof from === 'undefined' || from === null) {
            throw Error(`Cannot find (from) item ${this.from_item}`);
        }

        let to = ohitems.getItem(this.to_item);
        if(typeof to === 'undefined' || to === null) {
            throw Error(`Cannot find (to) item ${this.to_item}`);
        }

        if(this.send) {
            to.sendCommand(from.state);
        } else {
            to.postUpdate(from.state);        
        }
        if(this.next){
            this.next.execute(args);
        }
    }

    _complete(){
        return this.from_item && this.to_item;
    }

    describe(){
        return `copy state from ${this.from_item} to ${this.to_item}`
    }
}

class SendCommandOperation {
    constructor(commandOrSupplier, optionalDesc) {
        this.next = null;
        if(typeof commandOrSupplier ==='string') {
            this.commandFn = () => commandOrSupplier;
            this.commandDesc = optionalDesc || commandOrSupplier;
        } else {
            this.commandFn = commandOrSupplier;
            this.commandDesc = optionalDesc || '[something]';
        }
        
        this.toItem = function (itemName) {
            this.operation = {
                execute: (args) => ohitems.getItem(itemName).sendCommand(this.commandFn(args)),
                describe: () => `send ${this.commandDesc} to ${itemName}` + (this.next ? ` and ${this.next.describe()}` : "")
            };
            return this;
        };
        this.and = function (next) {
            this.next = next;
            return this;
        }
        this._run = (args) => this.operation.execute(args) && (this.next && this.next.execute(args))
        this._complete = () => true;
        this.describe = () => this.operation.describe();
    }
}

class ToggleOperation {
    constructor() {
        this.next = null;
        this.toItem = function (itemName) {
            this.itemName = itemName;
            return this;
        };
        this.and = function (next) {
            this.next = next;
            return this;
        };
        this._run = () => this.doToggle() && (this.next && this.next.execute())
        this._complete = () => true;
        this.describe = () => `toggle ${this.itemName}` + (this.next ? ` and ${this.next.describe()}` : "")
    }

    doToggle(){
        let item = ohitems.getItem(this.itemName);

        log.error(`s=${typeof item.rawState.getBrightness()} ${'0' != item.rawState.getBrightness().toString()}`);

        switch(item.type) {
            case "SwitchItem": {
                let toSend = ('ON' == item.state) ? 'OFF' : 'ON';
                item.sendCommand(toSend);
                break; 
            }
            case "ColorItem": {
                let toSend = ('0' != item.rawState.getBrightness().toString()) ? 'OFF' : 'ON';
                item.sendCommand(toSend);
                break; 
            }
            default: 
                throw error(`Toggle not supported for items of type ${item.type}`);
        }
    }
}

class TimingItemStateOperation {
    constructor(item_changed_trigger_config, duration) {

        if(typeof item_changed_trigger_config.to_value === 'undefined') {
            throw error("Must specify item state value to wait for!");
        }

        this.item_changed_trigger_config = item_changed_trigger_config;
        this.duration_ms = (typeof duration === 'Number' ? duration : parse_duration.parse(duration))

        this._complete = item_changed_trigger_config._complete;
        this.describe = () => item_changed_trigger_config.describe() + " for " + duration;
    }

    _toOHTriggers() {
        //each time we're triggered, set a callback. 
        //If the item changes to something else, cancel the callback.
        //If the callback executes, run the operation

        //register for all changes as we need to know when it changes away
        switch (this.op_type) {
            case "changed":
                return [triggers.ChangedEventTrigger(this.item_name)];
            default:
                throw error("Unknown operation type: " + this.op_type);
        }
    }

    _executeHook(next) {
        if(items.get(this.item_changed_trigger_config.item_name).toString() === this.item_changed_trigger_config.to_value) {
            _start_wait(next);
        } else {
            _cancel_wait();
        }
    }

    _start_wait(next) {
        this.current_wait = setTimeout(next, this.duration_ms);
    }

    _cancel_wait() {
        if(this.current_wait) {
            cancelTimeout(this.current_wait);
        }
    }


}

module.exports = {
    SendCommandOperation,
    TimingItemStateOperation,
    ToggleOperation,
    CopyStateOperation
}