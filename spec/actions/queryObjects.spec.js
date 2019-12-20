const chai = require('chai');
const nock = require('nock');

const testCommon = require('../common.js');
const sugarModulesReply = require('../sugarModules.json');

const queryObjects = require('../../lib/actions/queryObjects.js');

// Disable real HTTP requests
nock.disableNetConnect();

nock(testCommon.refresh_token.url)
      .persist()
      .post('')
      .reply(200, testCommon.refresh_token.response);

describe('Query Objects module: getModules', () => {
  it('Retrieves the list of sugar modules', async () => {
    const scope = nock(testCommon.TEST_INSTANCE_URL)
      .get('/metadata?type_filter=full_module_list,modules')
      .reply(200, sugarModulesReply);

    const expectedResult = Object.keys(sugarModulesReply.full_module_list).reduce((result, key) => {
      if (key === '_hash') {
        return result;
      }
      const { fields } = sugarModulesReply.modules[key];
      if (Object.keys(fields).length === 1) {
        return result;
      }

      // eslint-disable-next-line no-param-reassign
      result[key] = sugarModulesReply.full_module_list[key];
      return result;
    }, {});

    const result = await queryObjects.getModules.call(testCommon, testCommon.configuration);
    chai.expect(result).to.deep.equal(expectedResult);
    scope.done();
  });
});

describe("Lookup Objects module: processAction", () => {
  it(`Queries objects: filter is an object, emitAll`, () => {

    testCommon.configuration.module = "Accounts";
    testCommon.configuration.outputMethod = "emitAll";

    const message = {
      body: {
        filter:[
          {
            $or: [
              {
                $and: [
                  {
                    "billing_address_country": {"$in":["India","Russia"]}
                  },
                  {
                    "somefield": {"$not_null":""}
                  }
                ]
              },
              {
                "somefield2": {"$is_null":""}
              }
            ]
          }
        ],
        fields: "id,name,billing_address_country,parent_name,modified_user_id,phone_office,accdate_c,acccheck_c,acc_float_c",
        max_num: 1000
      }
    };

    const testReply = {
      next_offset: -1,
      records: [{
        "id": "8a09adbc-16af-11ea-8530-021e085c12ca",
        "name": "Test_Account_52",
        "date_modified": "2019-12-04T16:02:57+00:00",
        "modified_by_name": "Mr Black",
        "billing_address_country": "Butan",
        "phone_office": "02021024103",
        "parent_name": "",
      },
      {
        "id": "8a09adbc-16af-11ea-8530-021e085c12ca",
        "name": "Test_Account_52",
        "date_modified": "2019-12-04T16:02:57+00:00",
        "modified_by_name": "Mr White",
        "billing_address_country": "France",
        "phone_office": "02021024103",
        "parent_name": "",
      }
    ]};

    nock(testCommon.TEST_INSTANCE_URL)
      .get(`/metadata?type_filter=modules&module_filter=${testCommon.configuration.module}`)
      .reply(200, sugarModulesReply);

    const scope = nock(testCommon.TEST_INSTANCE_URL)
      .post(`/Accounts/filter`, JSON.stringify(message.body))
      .reply(200, testReply);

    queryObjects.process.call(testCommon, message, testCommon.configuration);
    return new Promise(resolve => {
      testCommon.emitCallback = function(what, msg) {
        if (what === 'data') {
          chai.expect(msg.body).to.deep.equal(testReply.records);
          scope.done();
          resolve();
        }
      };
    });
  });

  it(`Queries objects: filter is a string, emitIndividually`, async () => {

    testCommon.configuration.module = "Accounts";
    testCommon.configuration.outputMethod = "emitIndividually";

    const message = {
      body: {
        filter:'[{"billing_address_country": {"$in":["India","Russia"]}}]',
        max_num: 1000,
        order_by: 'name:DESC,account_type:DESC,date_modified:ASC'
      }
    };

    const expectedRequestBody = {
      ...message.body,
      filter: JSON.parse(message.body.filter)
    }

    const testReply = {
      next_offset: -1,
      records: [{
        "id": "8a09adbc-16af-11ea-8530-021e085c12ca",
        "name": "Test_Account_52",
        "date_modified": "2019-12-04T16:02:57+00:00",
        "modified_by_name": "Mr Black",
        "billing_address_country": "Butan",
        "phone_office": "02021024103",
        "parent_name": "",
      },
      {
        "id": "8a09adbc-16af-11ea-8530-021e085c12ca",
        "name": "Test_Account_52",
        "date_modified": "2019-12-04T16:02:57+00:00",
        "modified_by_name": "Mr White",
        "billing_address_country": "France",
        "phone_office": "02021024103",
        "parent_name": "",
      }
    ]};

    nock(testCommon.TEST_INSTANCE_URL)
      .get(`/metadata?type_filter=modules&module_filter=${testCommon.configuration.module}`)
      .reply(200, sugarModulesReply);

    const scope = nock(testCommon.TEST_INSTANCE_URL)
      .post(`/Accounts/filter`, JSON.stringify(expectedRequestBody))
      .reply(200, testReply);

    const observedResult = [];
    testCommon.emitCallback = function(what, msg) {
      if (what === 'data') {
        observedResult.push(msg.body);
      }
    };

    await queryObjects.process.call(testCommon, message, testCommon.configuration);
    chai.expect(observedResult).to.deep.equal(testReply.records);
    scope.done();
  });
});
