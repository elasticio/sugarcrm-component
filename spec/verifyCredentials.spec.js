const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const nock = require('nock');
const testCommon = require('./common');
const verifyCredentials = require('../verifyCredentials');

chai.use(chaiAsPromised);
const { expect } = chai;
nock.disableNetConnect();


describe('SugarCRM verifyCredentials', () => {
  beforeEach(async () => {
    nock(testCommon.TEST_INSTANCE_URL)
      .post(testCommon.refresh_token.path)
      .reply(200, testCommon.refresh_token.response);
  });

  it('valid credentials', async () => {
    nock(testCommon.TEST_INSTANCE_URL)
      .get('/ping')
      .reply(200, 'pong');
    const result = await verifyCredentials.call(testCommon, testCommon.configuration);
    expect(result).to.deep.equal({ verified: true });
  });

  it('invalid credentials', async () => {
    nock(testCommon.TEST_INSTANCE_URL)
      .get('/ping')
      .reply(401);
    await expect(verifyCredentials.call(testCommon, testCommon.configuration)).be.rejectedWith('Credentials verification failed! StatusCode: 401');
  });

  it('invalid response', async () => {
    nock(testCommon.TEST_INSTANCE_URL)
      .get('/ping')
      .reply(200, 'ping');
    await expect(verifyCredentials.call(testCommon, testCommon.configuration)).be.rejectedWith('Error in validating credentials. Expected pong response');
  });
});
