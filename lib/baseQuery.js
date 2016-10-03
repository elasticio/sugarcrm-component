var SugarCRM = require('./sugarcrm');
var elasticio = require('elasticio-node');
var messages = elasticio.messages;
function capitalize(str) {
    var s = str.toLowerCase().split("");
    s[0] = s[0].toUpperCase();
    return s.join("");
}

module.exports = function trigger (componentObject, msg, cfg, snapshot) {
    var self = componentObject;
    var instance = new SugarCRM(cfg);
    var body = msg.body || {};
    var sugarModule = capitalize(body.module || cfg.module);
    var sugarQuery;
    try {
        sugarQuery = JSON.parse(body.query || cfg.query);
    } catch(e) {
        onError(e.message);
        return onEnd();
    }
    snapshot = snapshot || {};

    function getQueryPromise () {
        return instance.getQuery(sugarModule, sugarQuery, snapshot, self)
    }

    function iterateList (entries) {
        entries.forEach(function(entry) {
            var outputMessage = messages.newMessageWithBody(entry);
            self.emit('data', outputMessage);
            snapshot[entry.id] = instance.getHash(entry);
        });
        self.emit('snapshot', snapshot);
    }

    function onError (reason) {
        self.emit('error', reason);
    }

    function onEnd () {
        self.emit('end');
    }

    instance.auth()
        .then(getQueryPromise)
        .then(iterateList)
        .fail(onError)
        .finally(onEnd);
}
