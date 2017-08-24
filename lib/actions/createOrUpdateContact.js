var action = require('../baseAction');

exports.process = processAction;

async function processAction (msg, cfg, snapshot) {
    return await action(this, 'Contacts', msg, cfg, snapshot);
}