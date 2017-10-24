'use strict';

const trigger = require('../baseTrigger');
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
    const response = await instance.makeRequest('WebLogicHooks', 'POST', {
        trigger_event: "after_save",
        url: process.env.ELASTICIO_FLOW_WEBHOOK_URI,
        request_method: "POST",
        webhook_target_module: cfg.module,
        description: "Created by the elastic.io platform",
        name: `Elastic.io Get new and updated ${cfg.module} webhook`
    });

    return {
        name: response.name,
        id: response.id
    };
};

exports.shutdown = async function shutdown(cfg, startData) {
    const instance = new SugarCRM(cfg, this);
    await instance.makeRequest(`WebLogicHooks/${startData.id}`, 'DELETE');
};

exports.getMetaModel = async function getMetaModel(cfg) {
    const instance = new SugarCRM(cfg, this);
    return await instance.buildSchemaForModule(cfg.module);
};