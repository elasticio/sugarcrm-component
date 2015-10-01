var action = require('../baseAction');

exports.process = processAction;

function processAction (msg, cfg, snapshot) {
    action(this, 'Accounts', msg, cfg, snapshot);
}