const SugarCRM = require('./lib/sugarcrm');

module.exports = async function Verify(credentials) {
  this.logger.info('Verify credentials started...');
  let pingResponse;
  try {
    const instance = new SugarCRM(credentials, this);
    pingResponse = await instance.makeRequest('ping', 'GET');
  } catch (e) {
    const err = `Credentials verification failed!${e.statusCode ? ` StatusCode: ${e.statusCode}` : ''}${e.errorCode ? ` Reason: ${e.errorCode}` : ''}`;
    this.logger.error(err);
    throw err;
  }
  if (pingResponse === 'pong') {
    this.logger.info('Successfully verified credentials.');
    return { verified: true };
  }
  this.logger.info('Error in validating credentials. Expected pong response');
  throw new Error('Error in validating credentials. Expected pong response');
};
