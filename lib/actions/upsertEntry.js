'use strict';

const Action = require('../baseAction');
const SugarCRM = require('../sugarcrm');

exports.process = async function ProcessAction(msg, cfg) {
    const action = new Action(this, cfg, cfg.module);
    return await action.upsertObject(msg, cfg.externalIdProperty);
};

exports.modules = async function getModules(cfg) {
    const instance = new SugarCRM(cfg, this);
    return await instance.getModules();
};

exports.getMetaModel = async function getMetaModel(cfg) {
    const instance = new SugarCRM(cfg, this);
    return await instance.buildSchemaForModule(cfg.module);
};