"use strict";
let fs = require("fs");
var path = require('path');

//全部model对象
const models = module.exports = {};
fs.readdirSync(__dirname + "/../models/").forEach(function (file) {
  if (/.js$/.test(file)) {
    models[file.replace('.js', '')] = require("../models/" + file);
  }
});

//初始化model
models.factory = function (name) {
  if (!models[name]) throw new Error('暂无' + name + '数据模型');
  return models[name].factory();
}
