const defaultFields = require("./defaultFields.js");

exports.fields = Object.assign(
{
  "id": {
    "type": "id",
    "description": ""
  },
  "name": {
    "type": "string",
    "description": "联系人姓名",
    "max": 255
  },
  "contact_id": {
    "type": "string",
    "description": "联系人id",
    "max": 32
  },
  "user_id": {
    "type": "number",
    "description": "用户id"
  },
  "total_amount": {
    "type": "number",
    "description": "总金额"
  },
  "repay_amount": {
    "type": "number",
    "description": "已还金额"
  },
  "status": {
    "type": "number",
    "description": "1 已完成"
  },
  "classify": {
    "type": "number",
    "description": "0 借出 1 借入"
  },
  "plan_repay_at": {
    "type": "datetime",
    "description": "计划还款日"
  },
  "repay_at": {
    "type": "datetime",
    "description": "实际还款日"
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
