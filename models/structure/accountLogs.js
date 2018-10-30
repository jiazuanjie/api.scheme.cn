const defaultFields = require("./defaultFields.js");

exports.fields = Object.assign(
{
  "id": {
    "type": "id",
    "description": ""
  },
  "account_id": {
    "type": "number",
    "description": "账本id"
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
  "created_at": {
    "type": "datetime",
    "description": "创建时间"
  },
  "update_at": {
    "type": "datetime",
    "description": "更新时间"
  },
  "is_deleted": {
    "type": "number",
    "description": ""
  }
}, defaultFields);
