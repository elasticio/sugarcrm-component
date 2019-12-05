const { messages } = require('elasticio-node');
const SugarCrm = require('../sugarcrm');

exports.process = async function ProcessAction(msg, cfg) {
  if (!msg.body.objects || !Array.isArray(msg.body.objects)) {
    this.logger.error('input parameter "Objects" isn\'t an Array');
    this.emit('data', messages.newMessageWithBody({ }));
    return;
  }
  const instance = new SugarCrm(cfg, this);
  const reqs = [];
  for (let i = 0; i < msg.body.objects.length; i += 1) {
    reqs.push({
      url: `${SugarCrm.API_VERSION}/${cfg.module}`,
      method: 'POST',
      data: JSON.stringify(msg.body.objects[i]),
    });
  }
  const createdObjects = await instance.makeRequest('bulk', 'POST', { requests: reqs });
  this.emit('data', messages.newMessageWithBody({ result: createdObjects }));
};

exports.modules = async function getModules(cfg) {
  const instance = new SugarCrm(cfg, this);
  return instance.getModules(false);
};
