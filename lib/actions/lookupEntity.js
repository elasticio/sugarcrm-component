'use strict';

const SugarCrm = require('../sugarcrm');
const { messages } = require('elasticio-node');

exports.process = async function ProcessAction(msg, cfg) {
    const instance = new SugarCrm(cfg, this);
    const entity = await instance.makeRequest(`${encodeURIComponent(cfg.module)}/${msg.body.id}`, 'GET');
    this.emit('data', messages.newMessageWithBody(entity));
};

exports.modules = async function getModules(cfg) {
    const instance = new SugarCrm(cfg, this);
    return await instance.getModules(true);
};
