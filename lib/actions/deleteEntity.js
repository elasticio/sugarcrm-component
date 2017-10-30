'use strict';

const SugarCRM = require('../sugarcrm');
const { messages } = require('elasticio-node');

exports.process = async function ProcessAction(msg, cfg) {
    const instance = new SugarCRM(cfg, this);
    const entity = await instance.makeRequest(`${encodeURIComponent(cfg.module)}/${msg.body.id}`, 'DELETE');
    this.emit('data', messages.newMessageWithBody(entity));
};

exports.modules = async function getModules(cfg) {
    const instance = new SugarCRM(cfg, this);
    return await instance.getModules();
};
