var sugarCRM = require('./lib/sugarcrm');

module.exports = verify;

async function verify(credentials) {
    try {
        const instance = new sugarCRM(credentials, this);
        const pingResponse = await instance.makeRequest('ping', 'GET');
        return pingResponse === 'pong';
    } catch (e) {
        console.log('Exception: ' + e.toString());
        return false;
    }
}

