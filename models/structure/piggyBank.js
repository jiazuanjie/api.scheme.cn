const defaultFields = require("./defaultFields.js");

exports.fields = Object.assign(
{
  "title": {
    "type": "string",
    "description": "描述",
    "max": 16
  },
  "target_amount": {
    "type": "number",
    "description": "目标金额"
  },
  "completed_amount": {
    "type": "number",
    "description": "已存金额"
  },
  "type": {
    "type": "number",
    "description": "1 自由模式"
  },
  "start_date": {
    "type": "date",
    "description": "开始时间"
  },
  "target_date": {
    "type": "date",
    "description": "目标时间"
  },
  "created_at": {
    "type": "datetime",
    "description": "",
    "base": true
  },
  "user_id": {
    "type": "number",
    "description": "关联用户"
  },
  "id": {
    "type": "id",
    "description": ""
  },
  "is_finsh": {
    "type": "number",
    "description": "1 完成"
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
