const defaultFields = require("./defaultFields.js");

exports.fields = Object.assign(
{
  "created_at": {
    "type": "datetime",
    "description": "",
    "base": true
  },
  "man_id": {
    "type": "number",
    "description": ""
  },
  "woman_id": {
    "type": "number",
    "description": ""
  },
  "lover_date": {
    "type": "date",
    "description": ""
  },
  "wedding_date": {
    "type": "date",
    "description": ""
  },
  "is_closed": {
    "type": "number",
    "description": ""
  },
  "id": {
    "type": "id",
    "description": ""
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
