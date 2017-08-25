var sugarCRM = require('./lib/sugarcrm');

module.exports = verify;

async function verify(credentials) {
    try {
        const instance = new sugarCRM(credentials, this);
        const pingResponse = await instance.makeRequest('ping', 'GET');
        if (pingResponse === 'pong') {
            console.log('Successfully verified credentials.');
            return true;
        }
        console.log(`Error in validating credentials.  Expected pong.  Instead got: ${JSON.stringify(pingResponse)}`);
        return false;
    } catch (e) {
        // Workaround for https://github.com/elasticio/sailor-nodejs/issues/58
        console.log(`Exception: ${e.toString()} \n ${e.stack}`);
        return false;
    }
}

