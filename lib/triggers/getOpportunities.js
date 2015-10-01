var trigger = require('../baseTrigger');

exports.process = ProcessTrigger;

function ProcessTrigger(msg, cfg, snapshot) {
    trigger(this, 'Opportunities', cfg, snapshot);
}