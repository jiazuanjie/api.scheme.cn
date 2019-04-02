'use strict';
const Orm = require('../lib/orm');

exports.manage = async (ctx, next) => {
  ctx.teacher = await ctx.model('schoolTeacher').where({user_id: Orm.eq(ctx.uid)}).find();
  if (!ctx.teacher.id) {
    ctx.warning = '尚未登记成教师'; return ;
  }
  await next();
}

/**
 * 课时
 * @param ctx
 * @returns {Promise<void>}
 */
exports.classes = async (ctx) => {
  let toDate = ctx.query.date || lib.moment().format('YYYY-MM-DD');
  let changeClass = {};
  await ctx.model('teacherClassChange').where({date: Orm.eq(toDate), teacher_id: Orm.eq(ctx.teacher.id)}).findAll().then(classes => {
    classes.map(c => {changeClass[c.class_hour] = c})
  });
  let defaultClass = {};
  await ctx.model('teacherClass').where({teacher_id: Orm.eq(ctx.teacher.id), week: Orm.eq(lib.getWeek(toDate))}).findAll().then(record => {
    record.map(r => {defaultClass[r.class_hour] = r})
  });
  let records = [];
  for (let i = 1; i < 9; i++) {
    if (changeClass[i]) {
      changeClass[i].lessons += "(换)"
      records.push(changeClass[i]);
    } else if (defaultClass[i]) {
      records.push(defaultClass[i]);
    }
  }
  records = records.filter(r => r.is_me !== false)
  ctx.data.result = records;
}

/**
 * 增加/删除 课时
 * @param ctx
 * @returns {Promise<*>}
 */
exports.setClass = async (ctx) => {
  let model = ctx.model('teacherClassChange');
  model.setAttributes(ctx.post);
  model.setAttribute("teacher_id", ctx.teacher.id);
  let result = await model.create();
  if (!result) {
    return ctx.warning = model.getError();
  }
  ctx.data.result = {affected: 1}
}

/**
 * 换课
 * @param ctx
 * @returns {Promise<*>}
 */
exports.changeClass = async (ctx) => {
  const {class_id, week, class_hour} = ctx.post;
  if (!validator.isPosInt(class_id)) {
    return ctx.warning = 'class_id不存在';
  }
  let classes = await ctx.model('teacherClass').where({id: Orm.eq(class_id)}).find();
  if (!classes.id) {
    return ctx.warning = '课时不存在或已被删除';
  }
  let date = lib.getDateFromWeek(parseInt(week));
  if (classes.week == week && class_hour == classes.class_hour) {
    return ctx.data.result = {affected: 1}
  }
  //添加自定义课程
  await ctx.model('teacherClassChange').create({
    school_id: classes.school_id,
    teacher_id: ctx.teacher.id,
    date,
    class_hour,
    classes: classes.classes,
    lessons: classes.lessons,
    is_me: 1
  })
  //删除原先课程
  await ctx.model('teacherClassChange').create({
    school_id: classes.school_id,
    teacher_id: ctx.teacher.id,
    date: lib.getDateFromWeek(classes.week),
    class_hour: classes.class_hour,
    classes: classes.classes,
    lessons: classes.lessons,
    is_me: 0
  })
  ctx.data.result = {affected: 1}
}

exports.deleteClasses = async (ctx) => {
  const {class_id} = ctx.post;
  if (!validator.isPosInt(class_id)) {
    return ctx.warning = 'class_id不能为空'
  }
  let model = ctx.model('teacherClassChange').findByPk(class_id);
  if (!model.id) {
    return ctx.warning = '课程不存在或已被删除';
  }
  ctx.data.result = await {affected: model.deleteAll()}
}