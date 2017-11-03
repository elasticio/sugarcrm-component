'use strict';

const SugarCRM = require('../sugarcrm');

exports.process = async function ProcessAction(msg, cfg) {
    const instance = new SugarCRM(cfg, this);
    const module = cfg.module;

    if (msg.body.id) {
        const id = msg.body.id;
        console.log(`Will perform update to ${module} with id ${id}`);

        const putBody = Object.keys(msg.body)
            .filter(key => {
                const val = msg.body[key];
                return val !== undefined && val !== null && val !== '';     // false should not be filtered out
            }).reduce((bodySoFar, key) => {
                bodySoFar[key] = msg.body[key];
                return bodySoFar;
            }, {});

        const updatedRecord = await instance.makeRequest(`${module}/${id}`, 'PUT', putBody);
        return updatedRecord;
    } else {
        console.log(`Will create a ${module}`);
        const createdRecord = await instance.makeRequest(module, 'POST', msg.body);
        return createdRecord;
    }
};

exports.modules = async function getModules(cfg) {
    const instance = new SugarCRM(cfg, this);
    return await instance.getModules();
};

exports.getMetaModel = async function getMetaModel(cfg) {
    const instance = new SugarCRM(cfg, this);
    const modelMetadata = await instance.buildInSchemaForModule(cfg.module);
    modelMetadata.in.properties.id.required = false;
    return modelMetadata;
};
