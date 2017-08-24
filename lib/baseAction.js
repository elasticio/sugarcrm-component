var SugarCRM = require('./sugarcrm');
const messages = require('elasticio-node').messages;
const path = require('path');

module.exports = async function action (componentObject, method, msg, cfg, snapshot) {
    var self = componentObject;
    var body = msg.body;
    var id = body.id;
    delete body.id;
    var instance = new SugarCRM(cfg, self);

    var updateID =  snapshot[id] ? snapshot[id] : null;
    id = id || '';
    var method = id ? 'PUT' : 'POST';
    const entry = await instance.makeRequest(
        path.join(method, updateID),
        method,
        body
    );

    console.log('Received data: %j', entry);

    self.emit('data', messages.newMessageWithBody(entry));

    if (id) {
        var modifier = {$set: {}};
        modifier.$set[id] = entry.id;
        self.emit('updateSnapshot', modifier);
    }
}
