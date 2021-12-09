const { messages } = require('elasticio-node');
const SugarCrm = require('../sugarcrm');

const DEFAULT_PAGE_NUM = 0;
const DEFAULT_LIMIT_EMITSINGLE = 10000;
const DEFAULT_LIMIT_EMITALL = 1000;
const TERM_MAX_NUMBER = 99;

const LOGICAL_OPERATORS = {
  AND: '$and',
  OR: '$or',
};
const UNARY_COMPARISON_OPERATORS = {
  'IS NULL': '$is_null',
  'NOT NULL': '$not_null',
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
  ...UNARY_COMPARISON_OPERATORS,
  ...COMPARISON_OPERATORS_LIST,
};

function toNumberInInterval(strNum, min, max, defaultValue) {
  const num = parseInt(strNum, 10);

  if (Number.isNaN(num)) {
    return defaultValue;
  }

  if (Number.isInteger(min) && num < min) {
    return defaultValue;
  }

  if (Number.isInteger(max) && num > max) {
    return defaultValue;
  }

  return num;
}

function isNumberInInterval(num, min, max) {
  if (Number.isNaN(num) || num < min || num > max) {
    return false;
  }

  return true;
}

function fieldNameBeautify(fieldName) {
  return fieldName.charAt(0).toUpperCase() + fieldName.replace(/_/g, ' ').slice(1);
}

function fieldNameSugarfy(fieldName) {
  return fieldName.charAt(0).toLowerCase() + fieldName.replace(/\s/g, '_').slice(1);
}

module.exports.getModules = async function getModules(cfg) {
  const instance = new SugarCrm(cfg, this);
  return instance.getModules(true);
};

module.exports.getMetaModel = async function getMetaModel(configuration) {
  const result = {
    in: {
      type: 'object',
      properties: {},
    },
  };

  if (configuration.outputMethod === 'emitPage') {
    result.in.properties.pageSize = {
      title: 'Page size',
      type: 'number',
      required: true,
    };
    result.in.properties.pageNumber = {
      title: 'Page number',
      type: 'number',
      required: true,
    };
  } else {
    result.in.properties.limit = {
      title: 'Maximum number of records',
      type: 'number',
      required: false,
    };
  }

  const instance = new SugarCrm(configuration, this);
  const moduleMetaData = await instance.getModuleMetaData(configuration.module);
  const outSchema = instance.buildOutSchemaForModule(moduleMetaData);

  if (configuration.outputMethod === 'emitIndividually') {
    result.out = outSchema;
  } else {
    result.out = {
      type: 'object',
      properties: {
        records: {
          type: 'array',
          required: true,
          properties: outSchema.properties,
        },
      },
    };
  }

  const filterableFields = [];
  Object.entries(moduleMetaData.fields).forEach(([key, value]) => {
    if (key !== '_hash' && value.source !== 'non-db') {
      filterableFields.push(fieldNameBeautify(value.name));
    }
  });

  filterableFields.sort();

  const termNumber = parseInt(configuration.termNumber, 10);
  if (!isNumberInInterval(termNumber, 0, TERM_MAX_NUMBER)) {
    throw new Error('Number of search terms must be an integer value from the interval [0-99]');
  }

  for (let i = 1; i <= termNumber; i += 1) {
    result.in.properties[`sTerm_${i}`] = {
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

    if (i !== termNumber) {
      result.in.properties[`link_${i}_${i + 1}`] = {
        title: 'Logical operator',
        type: 'string',
        required: true,
        enum: Object.keys(LOGICAL_OPERATORS),
      };
    }
  }

  return result;
};

// Filter is built assuming that the AND operator has higher precedence than the OR operator
async function buildFilter(message, configuration) {
  const filter = [];
  const termNumber = parseInt(configuration.termNumber, 10);
  const instance = new SugarCrm(configuration, this);
  const moduleMetaData = await instance.getModuleMetaData(configuration.module);

  function getOrItem(termIndex) {
    let indx = termIndex;
    const orPart = [];

    function getValue(fieldName, fieldValueStr) {
      const field = Object.values(moduleMetaData.fields).find((value) => {
        if (value.name === fieldName) {
          return true;
        }

        return false;
      });

      if (!field) {
        throw new Error(`${configuration.module} module does not have ${fieldName} field.`);
      }

      if (field.type === 'bool') {
        if (fieldValueStr === 'true') {
          return true;
        }

        if (fieldValueStr === 'false') {
          return false;
        }

        throw new Error(`'${fieldValueStr}' is not a boolean value.`);
      }

      if (field.type === 'int' || field.type === 'float') {
        const num = parseFloat(fieldValueStr);
        if (Number.isNaN(num)) {
          throw new Error(`'${fieldValueStr}' is not a number.`);
        }

        return num;
      }

      return fieldValueStr;
    }

    while (indx <= termNumber && (indx === termIndex || message.body[`link_${indx - 1}_${indx}`] !== 'OR')) {
      const sTerm = message.body[`sTerm_${indx}`];
      const fieldName = fieldNameSugarfy(sTerm.fieldName);

      let value = '';
      if (!Object.keys(UNARY_COMPARISON_OPERATORS).includes(sTerm.condition)) {
        if (Object.keys(COMPARISON_OPERATORS_LIST).includes(sTerm.condition)) {
          value = sTerm.fieldValue.split(',').reduce((result, item) => {
            result.push(getValue(fieldName, item));
            return result;
          }, []);
        } else {
          value = getValue(fieldName, sTerm.fieldValue);
        }
      }

      orPart.push({
        [fieldName]: {
          [`${COMPARISON_OPERATORS[sTerm.condition]}`]: value,
        },
      });
      indx += 1;
    }

    // There are no 'and' operators in the current item
    if (indx === termIndex + 1) {
      return [indx, orPart[0]];
    }

    return [indx, { $and: orPart }];
  }

  let termIndex = 1;
  while (termIndex <= termNumber) {
    let orItem = [];
    [termIndex, orItem] = getOrItem(termIndex);
    filter.push(orItem);
  }

  // There are no 'or' operators
  if (filter.length < 2) {
    return filter;
  }

  return [{ $or: filter }];
}

module.exports.process = async function processAction(message, configuration) {
  this.logger.info('Preparing to query objects...');

  let limit = 0;
  let offset = 0;

  switch (configuration.outputMethod) {
    case 'emitPage':
      limit = toNumberInInterval(message.body.pageSize, 1, null, DEFAULT_LIMIT_EMITALL);
      offset = limit * toNumberInInterval(message.body.pageNumber, 0, null, DEFAULT_PAGE_NUM);
      break;

    case 'emitIndividually':
      limit = toNumberInInterval(message.body.limit, 1, null, DEFAULT_LIMIT_EMITSINGLE);
      break;

    case 'emitAll':
      limit = toNumberInInterval(message.body.limit, 1, null, DEFAULT_LIMIT_EMITALL);
      break;

    default:
  }

  const requestBody = {
    max_num: limit,
    offset,
  };

  const filter = await buildFilter.call(this, message, configuration);
  if (filter.length) {
    requestBody.filter = filter;
  }

  const instance = new SugarCrm(configuration, this);

  this.logger.info('Sending the request to SugarCRM...');
  const response = await instance.makeRequest(`${encodeURIComponent(configuration.module)}/filter`, 'POST', requestBody);
  this.logger.info(`Got ${response.records.length} records`);

  if (configuration.outputMethod === 'emitIndividually') {
    // eslint-disable-next-line no-restricted-syntax
    for (const record of response.records) {
      // eslint-disable-next-line no-await-in-loop
      await this.emit('data', messages.newMessageWithBody(record));
    }
  } else { // 'emitPage' 'emitAll'
    await this.emit('data', messages.newMessageWithBody(response.records));
  }
};
