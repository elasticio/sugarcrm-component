var sugarCRM = require('./lib/sugarcrm');

module.exports = verify;

async function verify(credentials) {
    const instance = new sugarCRM(credentials, this);
    const pingResponse = await instance.makeRequest('ping', 'GET');
    return pingResponse === 'pong';
}

