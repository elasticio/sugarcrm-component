const SugarCrm = require('../sugarcrm');

exports.process = async function ProcessTrigger(msg) {
  this.emitData(msg);
};

exports.modules = async function getModules(cfg) {
  const instance = new SugarCrm(cfg, this);
  return instance.getModules(true);
};

exports.startup = async function startup(cfg) {
  const instance = new SugarCrm(cfg, this);
  return instance.webhookStartup('after_save');
};

exports.shutdown = async function shutdown(cfg, startData) {
  const instance = new SugarCrm(cfg, this);
  await instance.makeRequest(`WebLogicHooks/${startData.id}`, 'DELETE');
};

exports.getMetaModel = async function getMetaModel(cfg) {
  const instance = new SugarCrm(cfg, this);
  const moduleMetaData = await instance.getModuleMetaData(module);
  return instance.buildOutSchemaForModule(moduleMetaData);
};
