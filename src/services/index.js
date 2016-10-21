'use strict';
const account = require('./account');
const role = require('./role');
const authentication = require('./authentication');
const user = require('./user');
const mongoose = require('mongoose');
module.exports = function () {
	const app = this;

	mongoose.connect(app.get('mongodb'));
	mongoose.Promise = global.Promise;

	app.configure(authentication);
	app.configure(user);
	app.configure(role);
	app.configure(role);
	app.configure(role);
	app.configure(account);
};
