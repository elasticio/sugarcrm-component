const { messages } = require('elasticio-node');
const SugarCrm = require('../sugarcrm');

exports.getModules = function getModules(cfg) {
  const instance = new SugarCrm(cfg, this);
  return instance.getModules(true);
};

exports.process = async function ProcessAction(msg, cfg) {
  const requestBody = { ...msg.body };
  if (typeof requestBody.filter === 'string') {
    requestBody.filter = JSON.parse(requestBody.filter);
  }
  const instance = new SugarCrm(cfg, this);
  const foundObjects = await instance.makeRequest(`${encodeURIComponent(cfg.module)}/filter`, 'POST', requestBody);
  if (cfg.outputMethod === 'emitAll') {
    this.emit('data', messages.newMessageWithBody(foundObjects.records));
  } else { // "emitIndividually"
    foundObjects.records.forEach((record) => {
      this.emit('data', messages.newMessageWithBody(record));
    });
  }
};
