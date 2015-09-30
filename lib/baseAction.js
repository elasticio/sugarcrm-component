var SugarCRM = require('./sugarcrm');

module.exports = function action (componentObject, method, msg, cfg, snapshot) {
    var self = componentObject;
    var body = msg.body;
    var id = body.id;
    delete body.id;
    var instance = new SugarCRM(cfg);
    instance
        .auth()
        .then(createOrUpdate)
        .then(emitData)
        .fail(onError)
        .finally(onEnd);

    function createOrUpdate() {
        var updateID =  snapshot[id] ? snapshot[id] : null;
        return instance.createOrUpdate(method, body, updateID);
    }

    function emitData(entry) {
        self.emit('data', entry);
        if (id) {
            var modifier = {$set: {}};
            modifier.$set[id] = entry.id;
            self.emit('updateSnapshot', modifier);
        }
    }

    function onError (reason) {
        self.emit('error', reason);
    }

    function onEnd () {
        self.emit('end');
    }
}