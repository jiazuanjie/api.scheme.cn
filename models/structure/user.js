const defaultFields = require("./defaultFields.js");

exports.fields = Object.assign(
{
  "id": {
    "type": "id",
    "description": ""
  },
  "username": {
    "type": "string",
    "description": "昵称",
    "max": 255
  },
  "password": {
    "type": "string",
    "description": "密码",
    "max": 32
  },
  "sex": {
    "type": "number",
    "description": "性别"
  },
  "nickname": {
    "type": "string",
    "description": "昵称",
    "max": 255
  },
  "birthday": {
    "type": "date",
    "description": "生日"
  },
  "avatar_path": {
    "type": "string",
    "description": "头像地址",
    "max": 250
  },
  "is_closed": {
    "type": "number",
    "description": ""
  },
  "last_visit_at": {
    "type": "datetime",
    "description": "最近操作时间"
  },
  "last_login_at": {
    "type": "datetime",
    "description": "最近登录时间"
  },
  "last_login_ip": {
    "type": "string",
    "description": "最近登录ip",
    "max": 32
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
