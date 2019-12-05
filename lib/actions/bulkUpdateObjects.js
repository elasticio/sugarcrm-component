const { messages } = require('elasticio-node');
const SugarCrm = require('../sugarcrm');

exports.process = async function ProcessAction(msg, cfg) {
  if (!msg.body.massupdate_params || !Array.isArray(msg.body.massupdate_params.uid)) {
    this.logger.error('Input "massupdate_params.uid" list isn\'t an Array');
    this.emit('data', messages.newMessageWithBody({ }));
    return;
  }
  const instance = new SugarCrm(cfg, this);
  const updatedObjects = await instance.makeRequest(`${encodeURIComponent(cfg.module)}/MassUpdate`, 'PUT', msg.body);
  this.emit('data', messages.newMessageWithBody(updatedObjects));
};

exports.modules = async function getModules(cfg) {
  const instance = new SugarCrm(cfg, this);
  return instance.getModules(false);
};
