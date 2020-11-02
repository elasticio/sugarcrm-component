const { Readable } = require('stream');
const requestPromise = require('request-promise');
const { messages } = require('elasticio-node');
const SugarCrm = require('../sugarcrm');

exports.process = async function ProcessAction(msg, cfg) {
  const instance = new SugarCrm(cfg, this);
  const { module } = cfg;
  let record;

  if (msg.body.id) {
    const { id } = msg.body;
    this.logger.info('Will perform update object');

    const putBody = Object.keys(msg.body)
      .filter((key) => {
        const val = msg.body[key];
        return val !== undefined && val !== null && val !== ''; // false should not be filtered out
      }).reduce((bodySoFar, key) => {
        // eslint-disable-next-line no-param-reassign
        bodySoFar[key] = msg.body[key];
        return bodySoFar;
      }, {});

    record = await instance.makeRequest(`${module}/${id}`, 'PUT', putBody);
  } else {
    this.logger.info('Will create an object');
    record = await instance.makeRequest(module, 'POST', msg.body);
  }

  // binary attachment
  try {
    if (cfg.utilizeAttachment) {
      let key;
      if (msg.attachments && Object.keys(msg.attachments).length > 0) {
        [key] = Object.keys(msg.attachments);
      }

      if (key) {
        this.logger.info('Attachment found');
        const meta = await instance.makeRequest(`metadata?type_filter=modules&module_filter=${cfg.module}`, 'GET');

        let fileField;
        const fields = Object.values(meta.modules[cfg.module].fields);
        for (let i = 0; i < fields.length; i += 1) {
          if (fields[i].type === 'file') {
            fileField = fields[i].name;
            break;
          }
        }
        this.logger.debug('Downloading attachment...');

        if (fileField) {
          const optsDownload = {
            uri: msg.attachments[key].url,
            method: 'GET',
            resolveWithFullResponse: true,
            encoding: null,
          };

          const response = await requestPromise(optsDownload);

          const stream = new Readable();
          stream.push(response.body);
          stream.push(null);

          await instance.makeRequestStream(`${encodeURIComponent(cfg.module)}/${record.id}/file/${fileField}/?filename=${key}`, 'PUT', stream);
          record[fileField] = key;
        }
      }
    }
  } catch (err) {
    this.logger.warn('File attachment failed!');
  }

  this.emit('data', messages.newMessageWithBody(record));
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
