const { Readable } = require('stream');
const request = require('request');
const { messages } = require('elasticio-node');
const client = require('elasticio-rest-node')();
const SugarCrm = require('../sugarcrm');

exports.process = async function ProcessAction(msg, cfg) {
  if (!msg.body.id) {
    if (cfg.allowIdToBeOmitted) {
      await this.emit('data', messages.newMessageWithBody({}));
      return;
    }
    const err = new Error('No ID provided');
    this.logger.error('No ID provided');
    this.emit('error', err);
    return;
  }

  const instance = new SugarCrm(cfg, this);
  let foundObject = null;

  try {
    foundObject = await instance.makeRequest(`${encodeURIComponent(cfg.module)}/${msg.body.id}`, 'GET');
  } catch (err) {
    this.logger.error('Error during lookup object occurred');
    this.emit('error', err);
    return;
  }

  // If the object has not been found
  if (!foundObject.id) {
    if (cfg.allowZeroResults) {
      await this.emit('data', messages.newMessageWithBody({}));
      return;
    }
    const err = new Error('The object has not been found');
    this.logger.error('The object has not been found');
    this.emit('error', err);
    return;
  }

  const outputMessage = messages.newMessageWithBody(foundObject);

  try {
    if (cfg.passBinaryData) {
      const meta = await instance.makeRequest(`metadata?type_filter=modules&module_filter=${cfg.module}`, 'GET');

      let fileField;
      const fields = Object.values(meta.modules[cfg.module].fields);
      for (let i = 0; i < fields.length; i += 1) {
        if (fields[i].type === 'file') {
          // Support only for documented type "file" with one file
          if (typeof (foundObject[fields[i].name]) === 'string') {
            fileField = fields[i].name;
          } else {
            this.logger.warn('Unsupported attachment type found!');
          }
          break;
        }
      }

      if (fileField) {
        const data = await instance.makeRequest(`${encodeURIComponent(cfg.module)}/${msg.body.id}/file/${fileField}`, 'GET', undefined, null);

        const signedUrl = await client.resources.storage.createSignedUrl();

        const stream = new Readable();
        stream.push(data);
        stream.push(null);
        await stream.pipe(request.put(signedUrl.put_url));

        outputMessage.attachments = {
          [foundObject[fileField]]: {
            url: signedUrl.get_url,
          },
        };
      }
    }
  } catch (err) {
    this.logger.warn('File attachment failed!');
  }

  await this.emit('data', outputMessage);
};

module.exports.getMetaModel = async function getMetaModel(configuration) {
  const result = {
    in: {
      type: 'object',
      properties: {
        id: {
          title: 'id',
          type: 'string',
          required: true,
        },
      },
    },
  };

  const instance = new SugarCrm(configuration, this);
  const moduleMetaData = await instance.getModuleMetaData(configuration.module);
  const outSchema = instance.buildOutSchemaForModule(moduleMetaData);
  result.out = outSchema;
  return result;
};

exports.modules = async function getModules(cfg) {
  const instance = new SugarCrm(cfg, this);
  return instance.getModules(true);
};
