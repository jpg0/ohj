
const GENERATED_RULE_ITEM_TAG = "GENERATED_RULE_ITEM";

const ohitems = require('./items');
const utils = require('./utils');
const log = require('./log')('rules');
const itemhistory = require('./itemhistory');
const osgi = require('./osgi');
const triggers = require('./triggers');
const automationManager = require('@runtime/RuleSupport').automationManager;

let RuleManager = null;
try {
    RuleManager = osgi.get_service("org.openhab.core.automation.RuleManager")
} catch(e) {
    RuleManager = osgi.get_service("org.eclipse.smarthome.automation.RuleManager")
}

const itemNameForRule = function (ruleConfig) {
    return "vRuleItemFor" + ohitems.safeItemName(ruleConfig.name);
}

const linkItemToRule = function (rule, item) {
    exports.JSRule({
        name: "vProxyRuleFor" + rule.getName(),
        description: "Generated Rule to toggle real rule for " + rule.getName(),
        triggers: [
            triggers.ItemStateUpdateTrigger(item.name)
        ],
        execute: function (data) {
            try {
                var itemState = data.state;
                log.debug("Rule toggle item state received as " + itemState);
                RuleManager.setEnabled(rule.getUID(), itemState == OFF ? false : true);
                log.info((itemState == OFF ? "Disabled" : "Enabled") + " rule " + rule.getName() + " [" + rule.getUID() + "]");
            } catch (e) {
                log.error("Failed to toggle rule " + rule.getName() + ": " + e);
            }
        }
    });
};

const getGroupsForItem = function (ruleConfig) {
    if (ruleConfig.ruleGroup) {
        var groupName = "gRules" + ohitems.safeItemName(ruleConfig.ruleGroup);
        log.debug("Creating rule group " + ruleConfig.ruleGroup);
        ohitems.replaceItem(groupName, "Group", null, ["gRules"], ruleConfig.ruleGroup, [GENERATED_RULE_ITEM_TAG]);
        return [groupName];
    }

    return ["gRules"];
}

exports.JSRule = function (obj) {
    let ruid = obj.name.replace(/[^\w]/g, "-") + "-" + utils.randomUUID();
    log.info("Adding rule " + obj.name ? obj.name : ruid);

    let SimpleRule = Java.extend(Java.type('org.openhab.core.automation.module.script.rulesupport.shared.simple.SimpleRule'));

    let doExecute = function (module, input) {
        try {
            return obj.execute(getTriggeredData(input));
        } catch (error) {
            log.error("Failed to execute rule {}: {} at line {}", ruid, error.message, error.lineNumber);
            throw error;
        }
    };

    var rule = new SimpleRule({
        execute: doExecute
    });

    var triggers = obj.triggers ? obj.triggers : obj.getEventTrigger();

    rule.setTemplateUID(ruid);

    if (obj.description) {
        rule.setDescription(obj.description);
    }
    if (obj.name) {
        rule.setName(obj.name);
    }

    //Register rule here
    if (triggers && triggers.length > 0) {
        rule.setTriggers(triggers);
        rule = automationManager.addRule(rule);
    }

    return rule;
};

exports.SwitchableJSRule = function (ruleConfig) {

    if (!ruleConfig.name) {
        throw Error("No name specified for rule!");
    }

    //first create a toggling item
    var itemName = itemNameForRule(ruleConfig);

    //then add the item
    var item = ohitems.replaceItem(itemName, "Switch", null, getGroupsForItem(ruleConfig), ruleConfig.description, [GENERATED_RULE_ITEM_TAG]);

    //create the real rule
    var rule = exports.JSRule(ruleConfig);

    //hook up a rule to link the item to the actual rule
    linkItemToRule(rule, item);

    if (item.isUninitialized) {
        //possibly load item's prior state
        let historicState = itemhistory.historicState(item, /*todo:fixme*/Java.type("org.joda.time.DateTime").now());

        if (historicState !== null) {
            item.postUpdate(historicState);
        } else {
            item.sendCommand('ON');
        }
    }
}

const getTriggeredData = function (input) {

    //log.debug("input", input);
    let event = input.get('event');
    var ev = event + "";
    //log.debug("event",ev.split("'").join("").split("Item ").join("").split(" "));
    var evArr = [];
    if (ev.includes("triggered")) {
        var atmp = ev.split(" triggered "); //astro:sun:local:astroDawn#event triggered START
        evArr = [atmp[0], "triggered", atmp[1]];
    } else {
        evArr = ev.split("'").join("").split("Item ").join("").split(" "); //Item 'benqth681_switch' received command ON
    }

    var d = {
        //size: 		input.size(),
        oldState: input.get("oldState") + "",
        newState: input.get("newState") + "",
        state: input.get("state") + "", //this occurs on an ItemStateUpdateTrigger
        receivedCommand: null,
        receivedState: null,
        receivedTrigger: null,
        itemName: evArr[0]
    };

    try {
        if (event !== null && event.getPayload()) {
            d.payload = JSON.parse(event.getPayload());
        }
    } catch (e) {
        log.warn("Failed to extract payload: {}", e.message);
    }

    switch (evArr[1]) {
        case "received":
            d.eventType = "command";
            d.triggerType = "ItemCommandTrigger";
            d.receivedCommand = input.get("command") + "";
            break;
        case "updated":
            d.eventType = "update";
            d.triggerType = "ItemStateUpdateTrigger";
            d.receivedState = input.get("state") + "";
            break;
        case "changed":
            d.eventType = "change";
            d.triggerType = "ItemStateChangeTrigger";
            break;
        case "triggered":
            d.eventType = "triggered";
            d.triggerType = "ChannelEventTrigger";
            d.receivedTrigger = evArr[2];
            break;
        default:
            if (input.size() == 0) {
                d.eventType = "time";
                d.triggerType = "GenericCronTrigger";
                d.triggerTypeOld = "TimerTrigger";
            } else {
                d.eventType = "";
                d.triggerType = "";
            }
    }
    return d;
};	