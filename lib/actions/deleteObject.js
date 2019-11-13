const { messages } = require('elasticio-node');
const SugarCrm = require('../sugarcrm');

exports.process = async function ProcessAction(msg, cfg) {
  const instance = new SugarCrm(cfg, this);
  const deletedObject = await instance.makeRequest(`${encodeURIComponent(cfg.module)}/${msg.body.id}`, 'DELETE');
  this.emit('data', messages.newMessageWithBody(deletedObject));
};

exports.modules = async function getModules(cfg) {
  const instance = new SugarCrm(cfg, this);
  return instance.getModules(false);
};
