const { messages } = require('elasticio-node');
const SugarCrm = require('../sugarcrm');

exports.process = async function ProcessTrigger(msg) {
  await this.emit('data', messages.newMessageWithBody(msg));
};

exports.modules = async function getModules(cfg) {
  const instance = new SugarCrm(cfg, this);
  return instance.getModules(true);
};

exports.startup = async function startup(cfg) {
  const instance = new SugarCrm(cfg, this);
  return instance.webhookStartup(cfg, 'after_save');
};

exports.shutdown = async function shutdown(cfg, startData) {
  const instance = new SugarCrm(cfg, this);
  await instance.makeRequest(`WebLogicHooks/${startData.id}`, 'DELETE');
};
