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
  "user_id": {
    "type": "number",
    "description": "创建者id"
  },
  "contact_id": {
    "type": "string",
    "description": "联系人ID",
    "max": 32
  },
  "username": {
    "type": "string",
    "description": "联系人姓名",
    "max": 32
  },
  "amount": {
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
  },
  "is_deleted": {
    "type": "number",
    "description": ""
  }
}, defaultFields);
