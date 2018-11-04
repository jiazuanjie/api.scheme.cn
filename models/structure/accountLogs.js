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
  "is_repay" : {
    "type": "number",
    "description": "1 拿钱 2 给钱"
  },
  "remark": {
    "type": "string",
    "description": "备注",
    "max": 255
  },
  "repay_date": {
    "type": "string",
    "description": "记录日期",
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
