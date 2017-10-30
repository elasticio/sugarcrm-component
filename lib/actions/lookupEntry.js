'use strict';

const SugarCRM = require('../sugarcrm');

exports.process = async function ProcessAction(msg, cfg) {
    const instance = new SugarCRM(cfg, this);
    return await instance.makeRequest(`${encodeURIComponent(cfg.module)}/${msg.body.id}`, 'GET');
};

exports.modules = async function getModules(cfg) {
    const instance = new SugarCRM(cfg, this);
    return await instance.getModules();
};
