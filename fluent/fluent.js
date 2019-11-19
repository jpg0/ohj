const log = require('log').Logger('fluent');
const ohitems = require('../items');
const rules = require('../rules');

const triggers = require('./trigger-conf');
const operations = require('./operation-conf');
const conditions = require('./condition-conf');

class FluentRule {
    constructor(triggerConf, toggleable) {
        this._triggerConfs = [];
        this.toggleable = toggleable;
        this.or(triggerConf);
    }

    or(triggerConf) {
        if (!triggerConf._complete()) {
            throw Error("Trigger is not complete!");
        }
        this._triggerConfs.push(triggerConf);
        return this;
    }

    if(condition) {
        if(typeof condition === 'function') {
            condition = new conditions.FunctionConditionConf(condition);
        }

        log.debug("Setting condition on rule: {}", condition);

        this.condition = condition;
        return this;
    }

    then(operation, optionalRuleGroup) {
        if (typeof operation === 'function') {
            let operationFunction = operation;
            operation = {
                _complete: () => true,
                _run: x => operationFunction(x),
                describe: () => "custom function"
            }
        } else {
            //first check complete
            if (!operation._complete()) {
                throw Error("Operation is not complete!");
            }
        }

        this.operation = operation;
        this.optionalRuleGroup = optionalRuleGroup;

        let generatedTriggers = this._triggerConfs.flatMap(x => x._toOHTriggers())

        const ruleClass = this.toggleable ? rules.SwitchableJSRule : rules.JSRule;

        let fnToExecute = operation._run.bind(operation); //bind the function to it's instance

        //chain (of responsibility for) the execute hooks
        for(let triggerConf of this._triggerConfs) {
            let next = fnToExecute;
            if(typeof triggerConf._executeHook === 'function') {
            let maybeHook = triggerConf._executeHook();
                if(maybeHook) {
                    let hook = maybeHook.bind(triggerConf); //bind the function to it's instance
                    fnToExecute = function(args) {
                        return hook(next, args);
                    }
                }
            }
        }

        if(typeof this.condition !== 'undefined'){ //if conditional, check it first
            log.debug("Adding condition to rule: {}", this.condition);
            let fnWithoutCheck = fnToExecute;
            fnToExecute = (x) => this.condition.check(x) && fnWithoutCheck(x)
        }

        return ruleClass({
            name: ohitems.safeItemName(this.describe()),
            description: this.name,
            triggers: generatedTriggers,
            ruleGroup: optionalRuleGroup,
            execute: function (data) {
                    fnToExecute(data);
            }
        });
    }

    describe() {
        return "When " + this._triggerConfs.map(t => t.describe()).join(" or ") + " then " + this.operation.describe() + (this.optionalRuleGroup ? ` (in group ${this.optionalRuleGroup})` : "");
    }
}

const fluentExports = {
    when: o => new FluentRule(o, true),
    timeOfDay: s => new triggers.ItemTriggerConfig('vTimeOfDay').changed().to(s),
    cron: s => new triggers.CronTriggerConfig(s),
    inGroup: g => g,
    send: c => new operations.SendCommandOperation(c),
    sendOn: () => new operations.SendCommandOperation("ON"),
    sendOff: () => new operations.SendCommandOperation("OFF"),
    sendToggle: () => new operations.ToggleOperation(),
    sendIt: () => new operations.SendCommandOperation(args => args.it, "it"),
    item: s => new triggers.ItemTriggerConfig(s),
    copyState: () => new operations.CopyStateOperation(false),
    copyAndSendState: () => new operations.CopyStateOperation(true),
    stateOfItem: s => new conditions.ItemStateConditionConf(s)
}

module.exports = Object.assign({
    when: o => new FluentRule(o, false),
}, fluentExports);

module.exports.withToggle = Object.assign({
    when: o => new FluentRule(o, true),
}, fluentExports);