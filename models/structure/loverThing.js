const defaultFields = require("./defaultFields.js");

exports.fields = Object.assign(
{
  "created_at": {
    "type": "datetime",
    "description": "",
    "base": true
  },
  "id": {
    "type": "id",
    "description": ""
  },
  "lover_id": {
    "type": "number",
    "description": ""
  },
  "user_id": {
    "type": "number",
    "description": ""
  },
  "occur_date": {
    "type": "date",
    "description": "发生时间"
  },
  "content": {
    "type": "string",
    "description": "",
    "max": 255
  },
  "order_num": {
    "type": "number",
    "description": ""
  },
  "is_deleted": {
    "type": "number",
    "description": ""
  },
  "update_at": {
    "type": "datetime",
    "description": ""
  }
}, defaultFields);
