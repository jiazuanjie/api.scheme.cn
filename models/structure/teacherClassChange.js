const defaultFields = require("./defaultFields.js");

exports.fields = Object.assign(
{
  "id": {
    "type": "id",
    "description": ""
  },
  "school_id": {
    "type": "number",
    "description": ""
  },
  "teacher_id": {
    "type": "number",
    "description": ""
  },
  "date": {
    "type": "date",
    "description": ""
  },
  "class_hour": {
    "type": "number",
    "description": "课时"
  },
  "classes": {
    "type": "string",
    "description": "班级",
    "max": 32
  },
  "lessons": {
    "type": "string",
    "description": "课",
    "max": 32
  },
  "is_me": {
    "type": "number",
    "description": ""
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
