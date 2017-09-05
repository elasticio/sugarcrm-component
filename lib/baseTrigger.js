'use strict';

const SugarCRM = require('./sugarcrm');
const { messages } = require('elasticio-node');

module.exports = async function trigger(componentObject, module, cfg, snapshot = {}) {
    const instance = new SugarCRM(cfg, componentObject);
    snapshot.lastUpdated = snapshot.lastUpdated || (new Date(0)).toISOString();

    console.log('Last Updated is %s', snapshot.lastUpdated);

    const requestBody = {
        filter: [
            {
                date_modified: {
                    $gt: snapshot.lastUpdated
                }
            }
        ],
        order_by: 'date_modified:ASC'
    };

    if (cfg.maxNum) {
        if (Number.isInteger(cfg.maxNum)) {
            throw new Error('Value for number of records to fetch is not an integer number.');
        }
        const maxNum = Number.parseInt(cfg.maxNum);
        if (maxNum <= 0) {
            throw new Error('Value for number of records to fetch is not a positive number.');
        }
        requestBody.max_num = maxNum;
        console.log(`Will fetch a maximum of ${maxNum} records to fetch.`);
    } else {
        console.log(`No value provided for number of records to fetch.`);
    }

    const results = await instance.makeRequest(`${encodeURIComponent(module)}/filter`, 'POST', requestBody);

    if (!results || !Array.isArray(results.records)) {
        throw new Error(`Expected records array.  Instead received: ${JSON.stringify(results)}`);
    }
    let resultsList = results.records;
    resultsList.forEach((record) => {
        record.isNew = (new Date(record.date_entered)).getTime() === (new Date(record.date_modified)).getTime();
    });

    if (cfg.newUpdatedOrAll === 'new') {
        resultsList = resultsList.filter((record) => record.isNew);
    } else if (cfg.newUpdatedOrAll === 'updated') {
        resultsList = resultsList.filter((record) => !record.isNew);
    }

    console.log('Found %d new records.', resultsList.length);
    if (resultsList.length > 0) {
        if (cfg.returnIndividually === 'array') {
            componentObject.emit('data', messages.newMessageWithBody({
                data: resultsList
            }));
        } else {
            resultsList.forEach((record) => {
                componentObject.emit('data', messages.newMessageWithBody(record));
            });
        }

        snapshot.lastUpdated = resultsList[resultsList.length - 1].date_modified;
        console.log(`New snapshot: ${snapshot.lastUpdated}`);
        componentObject.emit('snapshot', snapshot);
    }
};
