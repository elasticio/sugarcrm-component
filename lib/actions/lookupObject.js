const { Readable } = require('stream');
const request = require('request');
const { messages } = require('elasticio-node');
const client = require('elasticio-rest-node')();
const SugarCrm = require('../sugarcrm');

exports.process = async function ProcessAction(msg, cfg) {
  const instance = new SugarCrm(cfg, this);
  const foundObject = await instance.makeRequest(`${encodeURIComponent(cfg.module)}/${msg.body.id}`, 'GET');

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
            this.logger.warn(`Unsupproted attachment type in "${fields[i].name}" field.`);
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
    this.logger.warn(`File attachment failed: ${err.message}`);
  }

  this.emit('data', outputMessage);
};

exports.modules = async function getModules(cfg) {
  const instance = new SugarCrm(cfg, this);
  return instance.getModules(true);
};
