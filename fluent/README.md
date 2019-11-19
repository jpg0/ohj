# Fluent API for Openhab Rules

Create rules in Openhab with a fluent JS API

## Requirements

- ES6 (e.g. GraalJS)
- CommonJS support

## Installation

The fluent directory can be copied to $OPENHAB_CONF/automation/lib/javascript/community/

## Usage

The API can be imported as a standard CommonJS module: `require('fluent')`. This will import all the functions that can be
used to construct the rule statements.
The cleanest way to use the API is with a `with` statement. This is so that it's possible to use the exported functions
without a prefix. An alternative approach (to allow `'use strict'`) would be to explicitly import the functions that you
use, such as `const {when, then} = require('fluent')`. The following examples will use the `with` style of importing.

## Examples

```
with(require('fluent')){

    //turn on the kitchen light at SUNSET
    when(timeOfDay("SUNSET")).then(sendOn().toItem("KitchenLight"));

    //turn off the kitchen light at 9PM
    when(cron("0 0 21 * * ?")).then(sendOff().toItem("KitchenLight"));

    //set the colour of the hall light to pink at 9PM
    when(cron("0 0 21 * * ?")).then(send("300,100,100").toItem("HallLight")

    //when the switch S1 status changes to ON, then turn on the HallLight
    when(item('S1').changed().toOn()).then(sendOn().toItem('HallLight'));

    //when the HallLight colour changes pink, if the function fn returns true, then toggle the state of the OutsideLight
    when(item('HallLight').changed().to("300,100,100")).if(fn).then(sendToggle().toItem('OutsideLight'));
}

//and some rules which can be toggled by the items created in the 'gRules' Group:

with(require('fluent').withToggle) {

    //when the HallLight receives a command, send the same command to the KitchenLight
    when(item('HallLight').receivedCommand()).then(sendIt().toItem('KitchenLight'));
 
    //when the HallLight is updated to ON, make sure that BedroomLight1 is set to the same state as the BedroomLight2
    when(item('HallLight').receivedUpdate()).then(copyState().fromItem('BedroomLight1').toItem('BedroomLight2'));

    //when the BedroomLight1 is changed, run a custom function
    when(item('BedroomLight1').changed()).then(() => {
        // do stuff
    });
}
```