'use strict';

let tasks = {};

tasks.addUserIntegral = async function (user_id, model, action, really_model_name, really_model_id) {
  if (!+user_id || !model || !action || !really_model_name || !+really_model_id) return false;
  // let ch = global['rabbitmq'];
  // let queue = 'add_user_integral';
  // ch.assertQueue(queue, {durable: true});
  // ch.sendToQueue(queue, new Buffer(JSON.stringify({user_id, model, action, really_model_name, really_model_id})));
}

module.exports = tasks;