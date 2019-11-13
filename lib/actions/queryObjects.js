const { messages } = require('elasticio-node');
const SugarCrm = require('../sugarcrm');

exports.process = async function ProcessAction(msg, cfg) {
  const instance = new SugarCrm(cfg, this);
  const requestBody = JSON.parse(msg.body);
  const foundObjects = await instance.makeRequest(`${encodeURIComponent(cfg.module)}/filter`, 'POST', requestBody);
  if (cfg.outputMethod === 'emitAll') {
    this.emit('data', messages.newMessageWithBody(foundObjects.records));
  } else { // "emitIndividually"
    foundObjects.records.forEach((record) => {
      this.emit('data', messages.newMessageWithBody(record));
    });
  }
};

exports.modules = function getModules(cfg) {
  const instance = new SugarCrm(cfg, this);
  return instance.getModules(true);
};
