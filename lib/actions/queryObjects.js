const { messages } = require('elasticio-node');
const SugarCrm = require('../sugarcrm');

exports.getModules = function getModules(cfg) {
  const instance = new SugarCrm(cfg, this);
  return instance.getModules(true);
};

exports.process = async function ProcessAction(msg, cfg) {
  const instance = new SugarCrm(cfg, this);
  const foundObjects = await instance.makeRequest(`${encodeURIComponent(cfg.module)}/filter`, 'POST', msg.body);
  if (cfg.outputMethod === 'emitAll') {
    await this.emit('data', messages.newMessageWithBody(foundObjects.records));
  } else { // "emitIndividually"
    // eslint-disable-next-line no-restricted-syntax
    for (const record of foundObjects.records) {
      // eslint-disable-next-line no-await-in-loop
      await this.emit('data', messages.newMessageWithBody(record));
    }
  }
};
