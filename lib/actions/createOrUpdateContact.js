var action = require('../baseAction');

exports.process = processAction;

function processAction (msg, cfg, next, snapshot) {
    action(this, 'Contacts', msg, cfg, snapshot);
}