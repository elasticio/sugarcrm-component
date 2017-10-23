'use strict';

const trigger = require('../baseTrigger');
const SugarCRM = require('../sugarcrm');

exports.process = async function ProcessTrigger(msg, cfg, snapshot) {
    return await trigger(this, cfg.module, cfg, snapshot);
};

exports.modules = async function getModules(cfg) {
    const instance = new SugarCRM(cfg, this);
    return await instance.getModules();
};
