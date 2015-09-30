var SugarCRM = require('./sugarcrm');
var elasticio = require('elasticio-node');
var messages = elasticio.messages;

module.exports = function trigger (componentObject, method, cfg, snapshot) {
    var self = componentObject;
    var instance = new SugarCRM(cfg);
    snapshot = snapshot || {};
    function getListPromise () {
        return instance.getList(method, snapshot, self)
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
        .then(getListPromise)
        .then(iterateList)
        .fail(onError)
        .finally(onEnd);
}