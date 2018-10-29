'use strict';
const Query = require('../lib/query');
const Mquery = require('../lib/mquery')
const Contacts = require('../models/mongo/contacts')

let tasks = {};

/**
 * 绑定通讯录
 * @param data
 * @param mongo
 * @param contact
 * @returns {Promise.<boolean>}
 */
tasks.bindContact = async function (data, mongo) {
  if (!data || !mongo) return false
  let contact = {}
  if (data.contact_id && validator.isObjectId(data.contact_id)) {
    contact = await Contacts.factory().setConn(mongo).findByPk(Mquery.ObjectId(data.contact_id));
    if (contact._id) return contact._id;
  }
  let username = data.username ? data.username : data.name
  let contactModel = Contacts.factory()
    contactModel.where({$or: [{$name: {$regex: username}}, {nickname: {$regex: data.username}}]})
  if (!!data.group_id) {
      contactModel.addWhere({group_id: data.group_id})
  }
  contact = await contactModel.find();
  if (!contact._id) {
    contact = await Contacts.factory().setConn(mongo).setAttributes({
      name: username,
      nickname: username,
      first_letter: lib.getFirstLetter(username).toUpperCase(),
      group_id: !!data.group_id ? data.group_id : 0,
      sex: 0,
      avatar_path: '',
      user_id: 0,
      bind_user_id: data.user_id,
      mobile: '',
      intimacy: 0
    }).create()
  }
  return contact._id
}

module.exports = tasks;