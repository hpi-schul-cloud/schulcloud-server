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
const analytics = require('./analytics');
const account = require('./account');
const authentication = require('./authentication');
const user = require('./user');
const role = require('./role');
const helpers = require('./helpers');
const resolve = require('./resolve');
const federalState = require('./federalState');
const holidays = require('./holidays');
const userGroup = require('./user-group');
const homework = require('./homework');
const passwordRecovery = require('./passwordRecovery');
const notification = require('./notification');
const releases = require('./releases');
const helpdesk = require('./helpdesk');
const statistic = require('./statistic');
const wopi = require('./wopi');
const pseudonym = require('./pseudonym');
const consent = require('./consent');
const mongoose = require('mongoose');
const clipboard = require('./clipboard');

module.exports = function() {
	const app = this;

	mongoose.connect(
		process.env.DB_URL || app.get('mongodb'),
		{ user: process.env.DB_USERNAME, pass: process.env.DB_PASSWORD }
	);
	mongoose.Promise = global.Promise;

	app.configure(authentication);
	app.configure(analytics);
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
	app.configure(homework);
	app.configure(federalState);
	app.configure(holidays);
	app.configure(passwordRecovery);
	app.configure(notification);
	app.configure(releases);
	app.configure(helpdesk);
	app.configure(statistic);
	app.configure(pseudonym);
	app.configure(consent);
	app.configure(clipboard);
	app.configure(wopi);
	app.configure(pseudonym);
	app.configure(consent);
};
