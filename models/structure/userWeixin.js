const defaultFields = require("./defaultFields.js");

exports.fields = Object.assign(
{
  "user_id": {
    "type": "number",
    "description": ""
  },
  "unionid": {
    "type": "string",
    "description": "微信用户统一id",
    "max": 30
  },
  "openid": {
    "type": "string",
    "description": "",
    "max": 30
  },
  "nickname": {
    "type": "string",
    "description": "微信昵称",
    "max": 30
  },
  "avatar_url": {
    "type": "string",
    "description": "用户头像",
    "max": 255
  },
  "gender": {
    "type": "number",
    "description": "性别"
  },
  "country": {
    "type": "string",
    "description": "",
    "max": 20
  },
  "province": {
    "type": "string",
    "description": "",
    "max": 100
  },
  "city": {
    "type": "string",
    "description": "",
    "max": 100
  },
  "language": {
    "type": "string",
    "description": "",
    "max": 20
  },
  "session_key": {
    "type": "string",
    "description": "",
    "max": 100
  },
  "id": {
    "type": "id",
    "description": ""
  },
  "is_deleted": {
    "type": "number",
    "description": ""
  }
}, defaultFields);
