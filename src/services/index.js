'use strict';
const school = require('./school');
const system = require('./system');
const account = require('./account');
const authentication = require('./authentication');
const user = require('./user');
const role = require('./role');
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
};
