const defaultFields = require("./defaultFields.js");

exports.fields = Object.assign(
  {
    "id": {
      "type": "id",
      "description": ""
    },
    "name": {
      "type": "string",
      "description": "姓名",
      "max": 64
    },
    "amount": {
      "type": "number",
      "description": "金额"
    },
  }, defaultFields);