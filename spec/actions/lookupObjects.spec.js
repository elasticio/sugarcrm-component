const chai = require('chai');
const nock = require('nock');

const testCommon = require('../common.js');
const sugarModulesReply = require('../sugarModules.json');

const lookupObjects = require('../../lib/actions/lookupObjects.js');

// Disable real HTTP requests
nock.disableNetConnect();

const LOGICAL_OPERATORS = {
  AND: '$and',
  OR: '$or',
};
const COMPARISON_OPERATORS_LIST = {
  IN: '$in',
  'NOT IN': '$not_in',
};
const COMPARISON_OPERATORS = {
  '=': '$equals',
  '!=': '$not_equals',
  '<': '$lt',
  '<=': '$lte',
  '>': '$gt',
  '>=': '$gte',
  'STARTS WITH': '$starts',
  'ENDS WITH': '$ends',
  CONTAINS: '$contains',
  'IS NULL': '$is_null',
  'NOT NULL': '$not_null',
  ...COMPARISON_OPERATORS_LIST,
};

function fieldNameBeautify(fieldName) {
  return fieldName.charAt(0).toUpperCase() + fieldName.replace(/_/g, ' ').slice(1);
}

describe('Lookup Objects module: getModules', () => {
  it('Retrieves the list of sugar modules', async () => {
    nock(testCommon.refresh_token.url)
      .post('')
      .reply(200, testCommon.refresh_token.response);

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

    const result = await lookupObjects.getModules.call(testCommon, testCommon.configuration);
    chai.expect(result).to.deep.equal(expectedResult);
    scope.done();
  });
});

describe('Lookup Objects module: getMetaModel', () => {
  function testMetaData(configuration) {
    const sugarScope = nock(testCommon.TEST_INSTANCE_URL)
      .get(`/metadata?type_filter=modules&module_filter=${configuration.module}`)
      .reply(200, sugarModulesReply);

    nock(testCommon.refresh_token.url)
      .post('')
      .reply(200, testCommon.refresh_token.response);

    const expectedResult = {
      in: {
        type: 'object',
        properties: {},
      },
      out: {
        type: 'object',
        properties: {
          records: {
            type: 'array',
            required: true,
            properties: {},
          },
        },
      },
    };

    if (configuration.outputMethod === 'emitPage') {
      expectedResult.in.properties.pageSize = {
        title: 'Page size',
        type: 'number',
        required: false,
      };
      expectedResult.in.properties.pageNumber = {
        title: 'Page number',
        type: 'number',
        required: true,
      };
    } else {
      expectedResult.in.properties.limit = {
        title: 'Maximum number of records',
        type: 'number',
        required: false,
      };
    }

    const sugarModule = sugarModulesReply.modules[configuration.module];
    const filterableFields = Object.entries(sugarModule.fields)
      .reduce((result, [key, value]) => {
        if (key !== '_hash' && value.source !== 'non-db') {
          result.push(fieldNameBeautify(value.name));
        }

        expectedResult.out.properties.records.properties[key] = {
          required: value.required,
          title: value.name,
          type: 'string',
        };

        return result;
      }, []);

    filterableFields.sort();

    for (let i = 1; i <= configuration.termNumber; ++i) {
      expectedResult.in.properties[`sTerm_${i}`] = {
        title: `Search term ${i}`,
        type: 'object',
        required: true,
        properties: {
          fieldName: {
            title: 'Field name',
            type: 'string',
            required: true,
            enum: filterableFields,
          },
          condition: {
            title: 'Condition',
            type: 'string',
            required: true,
            enum: Object.keys(COMPARISON_OPERATORS),
          },
          fieldValue: {
            title: 'Field value',
            type: 'string',
            required: true,
          },
        },
      };

      if (i != configuration.termNumber) {
        expectedResult.in.properties[`link_${i}_${i + 1}`] = {
          title: 'Logical operator',
          type: 'string',
          required: true,
          enum: Object.keys(LOGICAL_OPERATORS),
        };
      }
    }

    return lookupObjects.getMetaModel.call(testCommon, configuration)
      .then((data) => {
        chai.expect(data).to.deep.equal(expectedResult);
        sugarScope.done();
      });
  }

  it('Retrieves metadata for Accounts object', testMetaData.bind(null, {
    ...testCommon.configuration,
    module: 'Accounts',
    outputMethod: 'emitAll',
    termNumber: '1',
  }));

  it('Retrieves metadata for Notes object', testMetaData.bind(null, {
    ...testCommon.configuration,
    module: 'Notes',
    outputMethod: 'emitAll',
    termNumber: '2',
  }));

  it('Retrieves metadata for Leads object', testMetaData.bind(null, {
    ...testCommon.configuration,
    module: 'Leads',
    outputMethod: 'emitPage',
    termNumber: '2',
  }));
});

describe("Lookup Objects module: processAction", () => {
  beforeEach(async () => {
    nock(testCommon.refresh_token.url)
      .post('')
      .reply(200, testCommon.refresh_token.response);
  });

  it(`Gets Accounts objects: 2 string search terms, emitAll, limit`, () => {

    testCommon.configuration.module = "Accounts";
    testCommon.configuration.outputMethod = "emitAll";
    testCommon.configuration.termNumber = "2";

    const message = {
      body: {
        limit: 30,
        sTerm_1: {
          fieldName: "Document name",
          fieldValue: "NotVeryImportantDoc",
          condition: "="
        },
        link_1_2: "AND",
        sTerm_2: {
          fieldName: "Folder id",
          fieldValue: "Some folder ID",
          condition: "="
        }
      }
    };

    const expectedRequestBody = {
      filter: [
        {
          $and: [
            {
              document_name: { $equals: "NotVeryImportantDoc" }
            },
            {
              folder_id: { $equals: "Some folder ID" }
            }
          ]
        }
      ],
      max_num: 30,
      offset: 0,
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

    const scope = nock(testCommon.TEST_INSTANCE_URL)
      .post(`/Accounts/filter`, expectedRequestBody)
      .reply(200, testReply);

    lookupObjects.process.call(testCommon, message, testCommon.configuration);
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

  it(`Gets Accounts objects: 2 string search terms, IN operator, emitAll, limit`, () => {

    testCommon.configuration.module = "Accounts";
    testCommon.configuration.outputMethod = "emitAll";
    testCommon.configuration.termNumber = "2";

    const message = {
      body: {
        limit: 30,
        sTerm_1: {
          fieldName: "Document name",
          fieldValue: "NotVeryImportantDoc,Value_1,Value_2",
          condition: "IN"
        },
        link_1_2: "AND",
        sTerm_2: {
          fieldName: "Folder id",
          fieldValue: "Some folder ID",
          condition: "="
        }
      }
    };

    const expectedRequestBody = {
      filter: [
        {
          $and: [
            {
              document_name: { $in: ["NotVeryImportantDoc","Value_1","Value_2"] }
            },
            {
              folder_id: { $equals: "Some folder ID" }
            }
          ]
        }
      ],
      max_num: 30,
      offset: 0,
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

    const scope = nock(testCommon.TEST_INSTANCE_URL)
      .post(`/Accounts/filter`, expectedRequestBody)
      .reply(200, testReply);

    lookupObjects.process.call(testCommon, message, testCommon.configuration);
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
});
