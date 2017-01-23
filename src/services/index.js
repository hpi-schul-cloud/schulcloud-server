'use strict';
const fileStorage = require('./fileStorage');
const content = require('./content');
const ltiTool = require('./ltiTool');
const school = require('./school');
const system = require('./system');
const account = require('./account');
const authentication = require('./authentication');
const user = require('./user');
const role = require('./role');
const helpers = require('./helpers');

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
    app.configure(userGroup);
    app.configure(ltiTool);
    app.configure(content);
    app.configure(fileStorage);
    app.configure(helpers);
};
