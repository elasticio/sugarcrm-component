const { messages } = require('elasticio-node');
const SugarCrm = require('../sugarcrm');

exports.process = async function ProcessAction(msg, cfg) {
  const instance = new SugarCrm(cfg, this);
  const { module } = cfg;

  if (msg.body.id) {
    const { id } = msg.body;
    this.logger.info(`Will perform update to ${module} with id ${id}`);

    const putBody = Object.keys(msg.body)
      .filter((key) => {
        const val = msg.body[key];
        return val !== undefined && val !== null && val !== ''; // false should not be filtered out
      }).reduce((bodySoFar, key) => {
        // eslint-disable-next-line no-param-reassign
        bodySoFar[key] = msg.body[key];
        return bodySoFar;
      }, {});

    const updatedRecord = await instance.makeRequest(`${module}/${id}`, 'PUT', putBody);
    this.emit('data', messages.newMessageWithBody(updatedRecord));
  } else {
    this.logger.info(`Will create a ${module}`);
    const createdRecord = await instance.makeRequest(module, 'POST', msg.body);
    this.emit('data', messages.newMessageWithBody(createdRecord));
  }
};

exports.modules = async function getModules(cfg) {
  const instance = new SugarCrm(cfg, this);
  return instance.getModules(false);
};

exports.getMetaModel = async function getMetaModel(cfg) {
  const instance = new SugarCrm(cfg, this);
  const modelMetadata = await instance.buildInSchemaForModule(cfg.module);
  if (modelMetadata.in.properties.id) {
    modelMetadata.in.properties.id.required = false;
  }
  return modelMetadata;
};
