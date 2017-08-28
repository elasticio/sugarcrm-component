'use strict';

const SugarCRM = require('./sugarcrm');

function Action(componentObject, cfg, module) {
    const instance = new SugarCRM(cfg, componentObject);

    this.createObject = async function createObject(msg) {
        console.log(`Attempting to create ${module}: ${JSON.stringify(msg.body)}`);

        const createdRecord = await instance.makeRequest(module, 'POST', msg.body);
        console.log(`Created ${module}: ${JSON.stringify(createdRecord)}`);
        return createdRecord;
    };

    async function findObjectWithExternalId(externalId, externalIdProperty) {
        console.log(`Attempting to find ${module} with id ${externalId}`);
        const query = {
            filter: [{}]
        };
        query.filter[0][externalIdProperty] = externalId;
        const results = await instance.makeRequest(`${module}/filter`, 'POST', query);
        if (!results || !Array.isArray(results.records)) {
            throw new Error(`Expected records array.  Instead received: ${JSON.stringify(results)}`);
        }
        if (results.records.length > 1) {
            throw new Error("Multiple matching records found.");
        }
        if (results.records.length === 0) {
            return null;
        }
        return results.records[0].id;
    }

    async function doUpdate(idToUpdate, msg) {
        const updatedRecord = await instance.makeRequest(`${module}/${idToUpdate}`, 'PUT', msg.body);
        console.log('Updated Object: ' + JSON.stringify(updatedRecord));
        return updatedRecord;
    }

    this.updateObject = async function updateObject(msg, externalIdProperty)
    {
        const externalId = msg.body[externalIdProperty];
        delete msg.body.id;
        console.log(`Attempting to update ${module} with external id ${externalId} to: ${JSON.stringify(msg.body)}`);
        const idToUpdate = findObjectWithExternalId(externalId, externalIdProperty);
        console.log(`Found matching object with id ${idToUpdate}`);
        return doUpdate(idToUpdate, msg);
    };

    this.upsertObject = async function createOrUpdateObject(msg, externalIdProperty) {
        const externalId = msg.body[externalIdProperty];
        const idToUpdate = findObjectWithExternalId(externalId, externalIdProperty);
        if(externalId) {
            console.log(`Upsert action will update ${module} with id ${idToUpdate}`);
            return doUpdate(idToUpdate, msg);
        } else {
            console.log(`Upsert could not find an existing object.  Will insert`);
            return this.createObject(msg);
        }
    };
}

module.exports = Action;