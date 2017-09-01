var trigger = require('../baseTrigger');

exports.process = ProcessTrigger;

async function ProcessTrigger(msg, cfg, snapshot) {
    return await trigger(this, 'Accounts', cfg, snapshot);
}