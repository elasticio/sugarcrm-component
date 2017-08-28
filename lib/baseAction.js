'use strict';

const SugarCRM = require('./sugarcrm');
const messages = require('elasticio-node').messages;

module.exports.createObject = async function createObject(componentObject, module, cfg) {
    console.log(`Attempting to create ${module}: ${JSON.stringify(msg.body)}`);
    const instance = new SugarCRM(cfg, componentObject);
    const createdRecord = await instance.makeRequest(module, 'POST', msg.body);
    console.log(`Created ${module}: ${JSON.stringify(createdRecord)}`);
    return createdRecord;
};

module.exports.updateObject = async function updateObject(componentObject, module, cfg, id) {
    delete msg.body.id;
    console.log(`Attempting to update ${module} with id ${id} to: ${JSON.stringify(msg.body)}`);
    const instance = new SugarCRM(cfg, componentObject);
    const updatedRecord = await instance.makeRequest(`${module}/${id}`, 'PUT', msg.body);
    console.log('Updated Object: ' + JSON.stringify(updatedRecord));
    return updatedRecord;
};

module.exports.createOrUpdateObject = async function createOrUpdateObject(componentObject, module, cfg) {

};