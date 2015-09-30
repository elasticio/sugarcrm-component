var trigger = require('../baseTrigger');

exports.process = ProcessTrigger;

function ProcessTrigger(msg, cfg, next, snapshot) {
    trigger(this, 'Contacts', cfg, snapshot);
}