const { messages } = require('elasticio-node');
const SugarCrm = require('../sugarcrm');

exports.process = async function ProcessTrigger(msg, cfg, ss) {
  const instance = new SugarCrm(cfg, this);
  const snapshot = ss || {};
  snapshot.lastUpdated = snapshot.lastUpdated || (new Date(0)).toISOString();

  this.logger.debug('Last Updated is %s', snapshot.lastUpdated);

  const requestBody = {
    filter: [
      {
        date_modified: {
          $gt: snapshot.lastUpdated,
        },
      },
    ],
    order_by: 'date_modified:ASC',
  };

  if (cfg.maxNum) {
    if (Number.isInteger(cfg.maxNum)) {
      throw new Error('Value for number of records to fetch is not an integer number.');
    }
    const maxNum = Number.parseInt(cfg.maxNum, 10);
    if (maxNum <= 0) {
      throw new Error('Value for number of records to fetch is not a positive number.');
    }
    requestBody.max_num = maxNum;
    this.logger.info(`Will fetch a maximum of ${maxNum} records to fetch.`);
  } else {
    this.logger.info('No value provided for number of records to fetch.');
  }

  const results = await instance.makeRequest(`${encodeURIComponent(cfg.module)}/filter`, 'POST', requestBody);

  if (!results || !Array.isArray(results.records)) {
    throw new Error(`Expected records array. Instead received: ${JSON.stringify(results)}`);
  }
  const resultsList = results.records;

  this.logger.info('Found %d new records.', resultsList.length);
  if (resultsList.length > 0) {
    // eslint-disable-next-line no-restricted-syntax
    for (const record of resultsList) {
      // eslint-disable-next-line no-await-in-loop
      await this.emit('data', messages.newMessageWithBody(record));
    }

    snapshot.lastUpdated = resultsList[resultsList.length - 1].date_modified;
    this.logger.debug(`New snapshot: ${snapshot.lastUpdated}`);
    await this.emit('snapshot', snapshot);
  }
};

exports.modules = async function getModules(cfg) {
  const instance = new SugarCrm(cfg, this);
  return instance.getModules(true);
};

module.exports.getMetaModel = async function getMetaModel(configuration) {
  const result = {};

  const instance = new SugarCrm(configuration, this);
  const moduleMetaData = await instance.getModuleMetaData(configuration.module);
  const outSchema = instance.buildOutSchemaForModule(moduleMetaData);
  result.out = outSchema;
  return result;
};
