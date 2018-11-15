const defaultFields = require("./defaultFields.js");

exports.fields = Object.assign(
{
  "id": {
    "type": "id",
    "description": ""
  },
  "project_id": {
    "type": "number",
    "description": "项目id"
  },
  "is_advance": {
    "type": "number",
    "description": "1 预支"
  },
  "amount": {
    "type": "number",
    "description": "金额"
  },
  "remark": {
    "type": "string",
    "description": "备注",
    "max": 255
  },
  "is_deleted": {
    "type": "number",
    "description": ""
  },
  "created_at": {
    "type": "datetime",
    "description": ""
  },
  "update_at": {
    "type": "datetime",
    "description": ""
  }
}, defaultFields);
