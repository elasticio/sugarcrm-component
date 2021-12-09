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

module.exports.getMetaModel = async function getMetaModel(configuration) {
  const result = {
    in: {
      type: 'object',
      properties: {
        filter: {
          title: 'Filter expression',
          type: 'object',
          required: false,
        },
        max_num: {
          title: 'Maximum number of records',
          type: 'number',
          required: false,
        },
        offset: {
          title: 'The number of records to skip',
          type: 'number',
          required: false,
        },
        order_by: {
          maxLength: 20000,
          title: 'How to sort the returned records',
          type: 'string',
          required: false,
        },
      },
    },
  };

  const instance = new SugarCrm(configuration, this);
  const moduleMetaData = await instance.getModuleMetaData(configuration.module);
  const outSchema = instance.buildOutSchemaForModule(moduleMetaData);
  if (configuration.outputMethod === 'emitIndividually') {
    result.out = outSchema;
  } else {
    result.out = {
      type: 'array',
      required: true,
      properties: outSchema.properties,
    };
  }
  return result;
};
