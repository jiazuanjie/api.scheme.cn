const defaultFields = require("./defaultFields.js");

exports.fields = Object.assign(
{
  "id": {
    "type": "id",
    "description": ""
  },
  "name": {
    "type": "string",
    "description": "",
    "max": 32
  },
  "parent_id": {
    "type": "number",
    "description": ""
  },
  "orderby": {
    "type": "number",
    "description": ""
  },
  "is_deleted": {
    "type": "number",
    "description": ""
  }
}, defaultFields);
