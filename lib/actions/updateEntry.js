'use strict';

const Action = require('../baseAction');
const sugarCRM = require('../sugarcrm');

exports.process = processAction;

async function processAction(msg, cfg, snapshot) {
    const action = new Action(this, cfg, cfg.module);
    return await action.updateObject(msg, cfg.externalIdProperty);
}

exports.modules = async function getModules(cfg) {
    const instance = new sugarCRM(cfg, this);
    return await instance.getModules();
};