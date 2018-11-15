const defaultFields = require("./defaultFields.js");

exports.fields = Object.assign(
{
  "id": {
    "type": "id",
    "description": ""
  },
  "name": {
    "type": "string",
    "description": "名称",
    "max": 32
  },
  "user_id": {
    "type": "number",
    "description": ""
  },
  "card": {
    "type": "string",
    "description": "卡号",
    "max": 32
  },
  "logo_path": {
    "type": "string",
    "description": "银行卡logo",
    "max": 255
  },
  "billing_day": {
    "type": "date",
    "description": "账单日"
  },
  "repayment_day": {
    "type": "date",
    "description": "还款日"
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
