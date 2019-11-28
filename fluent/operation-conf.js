const parse_duration = require('parse-duration');
const log = require('../log').log('operation-conf');
const ohitems = require('../items');

/**
 * Copies state from one item to another item
 * 
 * @memberof fluent
 * @hideconstructor
 */
class CopyStateOperation {
    
    /**
     * Creates a new operation. Don't use constructor directly.
     * 
     * @param {Boolean} send whether to send (or post update) the state
     */
    constructor(send) {
        this.send = send;
    }

    /**
     * Sets the item to copy the state from
     * @param {String} item_name the item to copy state from
     * @returns {CopyStateOperation} this
     */
    fromItem(item_name){
        this.from_item = item_name;
        return this;
    }

    /**
     * Sets the item to copy the state to
     * @param {String} item_name the item to copy state to
     * @returns {CopyStateOperation} this
     */
    toItem(item_name){
        this.to_item = item_name;
        return this;
    }

    /**
     * Appends another operation to execute when the rule fires
     * @param {CopyStateOperation|SendCommandOperation|ToggleOperation} next 
     * @returns {CopyStateOperation} this
     */
    and(next) {
        this.next = next;
        return this;
    }
    
    /**
     * Runs the operation. Don't call directly.
     * 
     * @private
     * @param {Object} args rule firing args
     */
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

    /**
     * Checks that the operation configuration is complete. Don't call directly.
     * 
     * @private
     * @returns true only if the operation is ready to run
     */
    _complete(){
        return this.from_item && this.to_item;
    }

    /**
     * Describes the operation.
     * 
     * @private
     * @returns a description of the operation
     */
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