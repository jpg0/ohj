const log = require('../log').log('condition-conf')
const ohitems = require('../items')

class FunctionConditionConf {
    constructor(fn) {
        this.fn = fn;
    }

    check(...args) {
        let answer = this.fn(args);
        log.error("Condition check result: {}", answer);
        return answer;
    }
}

class ItemStateConditionConf {
    constructor(item_name) {
        this.item_name = item_name;
    }

    is(value) {
        this.values = [value];
        return this;
    }

    in(...values) {
        this.values = values;
        return this;
    }

    check(...args) {
        let item = ohitems.getItem(this.item_name);
        if(typeof item === 'undefined' || item === null) {
            throw Error(`Cannot find item: ${this.item_name}`);
        }
        return this.values.includes(item.state);
    }
}

module.exports = {
    FunctionConditionConf,
    ItemStateConditionConf
}