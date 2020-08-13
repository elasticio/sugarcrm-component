const SugarCRM = require('./lib/sugarcrm');

module.exports = function Verify(credentials, cb) {
  try {
    const instance = new SugarCRM(credentials, this);
    return instance.makeRequest('ping', 'GET').then((pingResponse) => {
      if (pingResponse === 'pong') {
        this.logger.info('Successfully verified credentials.');
        return cb(null, { verified: true });
      }
      this.logger.info(`Error in validating credentials.  Expected pong.  Instead got: ${JSON.stringify(pingResponse)}`);
      return cb(null, { verified: false });
    }).catch((e) => {
      this.logger.error(`Exception: ${e.toString()} \n ${e.stack}`);
      return cb(e, { verified: false });
    });
  } catch (e) {
    // Workaround for https://github.com/elasticio/sailor-nodejs/issues/58
    this.logger.error(`Exception: ${e.toString()} \n ${e.stack}`);
    return cb(e, { verified: false });
  }
};
