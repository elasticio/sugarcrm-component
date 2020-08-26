const chai = require('chai');
const nock = require('nock');

const testCommon = require('../common.js');
const testData = require('./upsertObject.json');
const upsert = require('../../lib/actions/upsertObject.js');

nock.disableNetConnect();


describe('SugarCRM upsert', () => {
  beforeEach(async () => {
    nock(testCommon.TEST_INSTANCE_URL)
      .post('/oauth/token')
      .times(3)
      .reply(200, testCommon.refresh_token.response);
  });


  it('action upsert with attachment', async () => {
    console.log('action upsert with attachment');

    const data = testData.upsertObjects;
    data.configuration = { ...testCommon.configuration, ...data.configuration };

    const expectedResult = { id: 'f93ca73e-1db7-11ea-b801-02af4f4486a2', name: 'Note1', filename: 'attachment.png' };

    const scopes = [];
    for (let host in data.responses) {
      for (let path in data.responses[host]) {
        const resp = data.responses[host][path].response;
        scopes.push(nock(host).
          intercept(path, data.responses[host][path].method).
          reply(200, typeof (resp) === 'object' ? JSON.stringify(resp) : resp, data.responses[host][path].header));
      }
    }

    const getResult = new Promise((resolve) => {
      testCommon.emitCallback = (what, msg) => {
        if (what === 'data') {
          resolve(msg);
        }
      };
    });

    upsert.process.call(testCommon, data.message, data.configuration);
    const result = await getResult;

    chai.expect(result.body).to.deep.equal(expectedResult);
  });
});
