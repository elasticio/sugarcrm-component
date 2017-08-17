'use strict';

const SugarCRM = require('./sugarcrm');
const { messages } = require('elasticio-node');

module.exports = async function trigger (componentObject, module, cfg, snapshot = {}) {
    const instance = new SugarCRM(cfg);
    snapshot.lastUpdated = snapshot.lastUpdated || (new Date(0)).toISOString();

    console.log('Last Updated is %s', snapshot.lastUpdated);

    await instance.auth();
    const results = await instance.getList(module, snapshot.lastUpdated);

    if (!results || !Array.isArray(results.records)) {
        throw new Error('Expected records array.  Instead recieved: ' + JSON.stringify(results));
    }
    const resultsList = results.records;

    console.log('Found %d new records.', resultsList.length);
    if(resultsList.length > 0) {
        snapshot.lastUpdated = resultsList[resultsList.length - 1].date_modified;

        componentObject.emit('data', messages.newMessageWithBody({
            data: resultsList
        }));

        console.log('New snapshot: ' + snapshot.lastUpdated);
        componentObject.emit('snapshot', snapshot);
    }
};