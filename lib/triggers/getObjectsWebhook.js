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

module.exports.getMetaModel = async function getMetaModel(configuration) {
  const result = {};

  const instance = new SugarCrm(configuration, this);
  const moduleMetaData = await instance.getModuleMetaData(configuration.module);
  const outSchema = instance.buildOutSchemaForModule(moduleMetaData);
  result.out = outSchema;
  return result;
};
