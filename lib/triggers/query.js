var action = require('../baseQuery');

exports.process = processAction;
exports.getSugarCRMModulesListModel = getSugarCRMModulesListModel;

function getSugarCRMModulesListModel(cfg, callback) {
    return callback(null, {'some': 'some', 'examples': 'examples'});
}

function processAction(msg, cfg, snapshot) {
    action(this, msg, cfg, snapshot);
}
