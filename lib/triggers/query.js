var action = require('../baseQuery');

exports.process = processAction;

function processAction(msg, cfg, snapshot) {
    action(this, msg, cfg, snapshot);
}
