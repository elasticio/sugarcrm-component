'use strict';

const SugarCrm = require('../sugarcrm');

exports.process = async function ProcessTrigger(msg) {
    this.emitData(msg);
};

exports.modules = async function getModules(cfg) {
    const instance = new SugarCrm(cfg, this);
    return await instance.getModules(false);
};

exports.startup = async function startup(cfg) {
    const instance = new SugarCrm(cfg, this);
    return await instance.webhookStartup(cfg, 'after_save');
};

exports.shutdown = async function shutdown(cfg, startData) {
    const instance = new SugarCrm(cfg, this);
    await instance.makeRequest(`WebLogicHooks/${startData.id}`, 'DELETE');
};
