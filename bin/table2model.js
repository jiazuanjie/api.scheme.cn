const co = require('co');
const conn = require('../lib/conn');
const readline = require('readline');
const Query = require('../lib/query');
const fs = require('fs');
const path = require('path');
const modelTemplate = fs.readFileSync(path.join(process.cwd(), 'bin', 'model.tmpl'), 'utf8');

const rootDir = path.join(process.cwd(), 'models');

let replace_profix = ''

if (process.env.NODE_ENV === 'production') {
  console.log(new Error(`不能在当前${process.env.NODE_ENV}环境下运行`));
  process.exit(0);
}
const r = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

r.question('模板名称:\n', modelName => {
  modelName = modelName.trim()
  if (!modelName) return console.log('请输入模型名称');

  start(modelName);
});

function start(tableName) {
  co(function*() {
    yield conn.main();
    const filename = camelize(tableName.replace(new RegExp(replace_profix), ''));
    const filepath = path.join(rootDir, 'structure', filename + '.js');
    const modelPath = path.join(rootDir, filename + '.js');

    yield generateModelDefinition(filepath, tableName, filename);
    if (!isFileExist(modelPath)) generateModelTemplate(modelPath, tableName, filename);
  })
    .then(() => process.exit())
    .catch(err => {
      console.log(err);
      process.exit();
    })
}

function camelize(modelName) {
  return modelName.split('_').map((v, idx) => {
    if (idx === 0) return v;
    return v.split('').map((v, idx) => {
      return idx === 0 ? v.toUpperCase() : v;
    }).join('');
  }).join('');
}

function getExistingModel(filepath) {
  const defaultFields = replace_profix ? ['id', 'is_deleted', 'create_at', 'update_at'] : ['id'];
  let fields = {};
  if (!isFileExist(filepath)) return fields;
  fields = require(filepath).fields;
  defaultFields.forEach(field => delete fields[field]);
  return fields;
}

function isFileExist(modelPath) {
  try {
    fs.statSync(modelPath);
    return true;
  } catch (err) {
    return false;
  }
}

function generateModelTemplate(modelPath, tableName, filename) {
  fs.writeFileSync(
    modelPath,
    modelTemplate.replace(/{{modelName}}/g, tableName.replace(new RegExp(replace_profix), '')).replace(/{{filename}}/g, filename)
  );
  console.log(`业务模型入口: /models/${filename}.js`);
}

function discoverModel(table) {
  return Query.factory('').query(
    `SELECT table_schema AS "owner",
        table_name AS "tableName",
         column_name AS "columnName",
         data_type AS "dataType",
         character_maximum_length AS "dataLength",
         numeric_precision AS "dataPrecision",
         numeric_scale AS "dataScale",
         column_comment AS "description",
         column_type AS "columnType",
         is_nullable = \'YES\' AS "nullable",
         CASE WHEN extra LIKE \'%auto_increment%\' THEN 1 ELSE 0 END AS "generated"
         FROM information_schema.columns
         WHERE table_name= ?  `, [table]);
}

function generateModelDefinition(filepath, tableName, filename) {
  return discoverModel(tableName)
    .then(fields => {
      let originFields = getExistingModel(filepath);
      fields = fields.map(fieldToProp).reduce((model, prop) => {
        return Object.assign(model, prop);
      }, {});
      deleteOriginFields(fields, originFields);
      fields = Object.assign({}, originFields, fields);

      const defaultFields = replace_profix ? 'defaultFields' : 'defaultUDFields';
      fs.writeFileSync(filepath, `const defaultFields = require("./${defaultFields}.js");\n\n`);
      fs.appendFileSync(filepath, 'exports.fields = Object.assign(\n');
      fs.appendFileSync(filepath, JSON.stringify(fields, null, '  '));
      fs.appendFileSync(filepath, `, defaultFields);\n`);
      console.log(`模型定义: /models/structure/${filename}.js`);
    });
}

function deleteOriginFields(newFields, originFields) {
  let newKeys = Object.keys(newFields);
  let oldKeys = Object.keys(originFields);

  for (let key of newKeys) {
    let index = oldKeys.indexOf(key);
    if (index != -1) oldKeys.splice(index, 1);
  }

  for (let key of oldKeys) delete originFields[key];

  const appendKeys = ['base', 'required', 'min', 'max', 'is_filter'];

  for (let key in originFields) {
    if (originFields.hasOwnProperty(key)) {
      appendKeys.forEach(appendKey => {
        if (originFields[key][appendKey] !== undefined && newFields[key][appendKey] === undefined) {
            newFields[key][appendKey] = originFields[key][appendKey]
        }
      })
    }
  }
}

function fieldToProp(field) {
  let type = mysqlDataTypeToJSONType(field.dataType);
  if (type === 'number' && field.generated) type = 'id';

  let prop = {
    [field.columnName]: {
      type: type,
      description: field.description || ''
    }
  };

  if (field.dataLength) {
    prop[field.columnName].max = field.dataLength;
  }

  return prop;
}

function mysqlDataTypeToJSONType(mysqlType) {
  var type = mysqlType.toUpperCase();
  switch (type) {
    case 'BOOLEAN':
      return 'boolean';
    case 'CHARACTER VARYING':
    case 'VARCHAR':
    case 'CHARACTER':
    case 'TEXT':
      return 'string';
    case 'BYTEA':
      return 'binary';
    case 'SMALLINT':
    case 'INTEGER':
    case 'INT':
    case 'TINYINT':
    case 'BIGINT':
    case 'DECIMAL':
    case 'NUMERIC':
    case 'REAL':
    case 'DOUBLE PRECISION':
    case 'SERIAL':
    case 'BIGSERIAL':
      return 'number';
    case 'DATE':
      return 'date';
    case 'TIMESTAMP':
      return 'datetime';
    default:
      return 'string';
  }
}
