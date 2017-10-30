'use strict';

const SugarCRM = require('../sugarcrm');

exports.process = async function ProcessTrigger(msg) {
    this.emitData(msg);
};

exports.modules = async function getModules(cfg) {
    const instance = new SugarCRM(cfg, this);
    return await instance.getModules();
};

exports.startup = async function startup(cfg) {
    const instance = new SugarCRM(cfg, this);
    return await instance.webhookStartup('after_save');
};

exports.shutdown = async function shutdown(cfg, startData) {
    const instance = new SugarCRM(cfg, this);
    await instance.makeRequest(`WebLogicHooks/${startData.id}`, 'DELETE');
};

exports.getMetaModel = async function getMetaModel(cfg) {
    const instance = new SugarCRM(cfg, this);
    return await instance.buildOutSchemaForModule(cfg.module);
};
