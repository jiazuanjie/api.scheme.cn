const defaultFields = require("./defaultFields.js");

exports.fields = Object.assign(
{
  "id": {
    "type": "id",
    "description": ""
  },
  "name": {
    "type": "string",
    "description": "项目名称",
    "max": 32
  },
  "intro": {
    "type": "string",
    "description": "项目简介",
    "max": 32
  },
  "classify": {
    "type": "number",
    "description": "0 送礼 1 收礼"
  },
  "type_id": {
    "type": "number",
    "description": "项目分类"
  },
  "user_id": {
    "type": "number",
    "description": "创建者"
  },
  "total_num": {
    "type": "number",
    "description": "总人数"
  },
  "total_amount": {
    "type": "number",
    "description": "总金额"
  },
  "is_fixed": {
    "type": "number",
    "description": "置顶"
  },
  "fixed_time": {
    "type": "datetime",
    "description": "置顶时间"
  },
  "is_closed": {
    "type": "number",
    "description": "关闭"
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
