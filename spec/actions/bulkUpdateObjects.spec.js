const chai = require('chai');
const nock = require('nock');

const testCommon = require('../common.js');
const testData = require('./bulkUpdateObjects.json');
const bulk = require('../../lib/actions/bulkUpdateObjects.js');

nock.disableNetConnect();


describe('SugarCRM bulk', () => {
  beforeEach(async () => {
    nock(testCommon.refresh_token.url)
      .post('')
      .reply(200, testCommon.refresh_token.response);
  });


  it('action update', async () => {
    console.log('action update');

    const data = testData.bulkUpdateObjects;
    data.configuration = { ...testCommon.configuration, ...data.configuration };

    const expectedResult = { status: 'done', failed: 0 };

    const scopes = [];
    for (let host in data.responses) {
      for (let path in data.responses[host]) {
        scopes.push(nock(host).
          intercept(path, data.responses[host][path].method).
          reply(200, data.responses[host][path].response, data.responses[host][path].header));
      }
    }

    const getResult = new Promise((resolve) => {
      testCommon.emitCallback = (what, msg) => {
        if (what === 'data') {
          resolve(msg);
        }
      };
    });

    bulk.process.call(testCommon, data.message, data.configuration);
    const result = await getResult;

    chai.expect(result.body).to.deep.equal(expectedResult);

    for (let i = 0; i < scopes.length; i += 1) {
      scopes[i].done();
    }
  });
});
