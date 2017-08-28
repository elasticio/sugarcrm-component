'use strict';

const trigger = require('../baseTrigger');
const SugarCRM = require('../sugarcrm');

exports.process = ProcessTrigger;

async function ProcessTrigger(msg, cfg, snapshot) {
    return await trigger(this, 'Accounts', cfg, snapshot);
}

exports.modules = async function getModules(cfg) {
    const instance = new sugarCRM(cfg, this);
    return instance.getModules();
}