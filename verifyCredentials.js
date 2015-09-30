var sugarCRM = require('./lib/sugarcrm');

module.exports = verify;

function verify(credentials, cb) {
    if (!credentials.baseUrl) {
        return cb(null, {verified: false});
    }

    var instance = new sugarCRM(credentials);

    function onResponse(response) {
        cb(null, {verified: true});
    }

    function onFail(error) {
        if (error.statusCode && (error.statusCode === 401 || error.statusCode === 400)) {
            return cb(null, {verified: false});
        }
        cb(error);
    }

    instance.auth()
        .then(onResponse)
        .fail(onFail);
}

