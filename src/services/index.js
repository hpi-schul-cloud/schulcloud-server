'use strict';
const fileStorage = require('./fileStorage');
const link = require('./link');
const news = require('./news');
const content = require('./content');
const calendar = require('./calendar');
const ltiTool = require('./ltiTool');
const school = require('./school');
const system = require('./system');
const lesson = require('./lesson');
const account = require('./account');
const authentication = require('./authentication');
const user = require('./user');
const role = require('./role');
const helpers = require('./helpers');
const resolve = require('./resolve');
const federalState = require('./federalState');

const userGroup = require('./user-group');

const mongoose = require('mongoose');

module.exports = function () {
    const app = this;

    mongoose.connect(app.get('mongodb'), {user:process.env.DB_USERNAME, pass:process.env.DB_PASSWORD});
    mongoose.Promise = global.Promise;

    app.configure(authentication);
    app.configure(user);
    app.configure(role);
    app.configure(account);
    app.configure(system);
    app.configure(school);
    app.configure(resolve);
    app.configure(userGroup);
    app.configure(ltiTool);
    app.configure(content);
    app.configure(calendar);
    app.configure(lesson);
    app.configure(fileStorage);
    app.configure(link);
    app.configure(news);
    app.configure(helpers);
    app.configure(federalState);
};
