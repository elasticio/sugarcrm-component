var action = require('../baseAction');

exports.process = processAction;

async function processAction (msg, cfg, snapshot) {
    return await action(this, 'Opportunities', msg, cfg, snapshot);
}