const mongoose = require('mongoose');

const account = require('./account');
const analytics = require('./analytics');
const authentication = require('./authentication');
const calendar = require('./calendar');
const clipboard = require('./clipboard');
const consent = require('./consent');
const content = require('./content');
const federalState = require('./federalState');
const fileStorage = require('./fileStorage');
const helpdesk = require('./helpdesk');
const helpers = require('./helpers');
const homework = require('./homework');
const ldap = require('./ldap');
const lesson = require('./lesson');
const link = require('./link');
const ltiTool = require('./ltiTool');
const me = require('./me');
const news = require('./news');
const newsEvents = require('./news/events');
const notification = require('./notification');
const passwordRecovery = require('./passwordRecovery');
const pseudonym = require('./pseudonym');
const releases = require('./releases');
const resolve = require('./resolve');
const rocketChat = require('./rocketChat');
const role = require('./role');
const school = require('./school');
const statistic = require('./statistic');
const sync = require('./sync');
const system = require('./system');
const teams = require('./teams');
const timelines = require('./timelines');
const user = require('./user');
const userGroup = require('./user-group');
const wopi = require('./wopi');

module.exports = function initializeServices() {
	const app = this;

	const dbCredentials = {
		user: process.env.DB_USERNAME,
		pass: process.env.DB_PASSWORD,
	};
	const DB_URL = process.env.DB_URL || app.get('mongodb');
	mongoose.connect(DB_URL, dbCredentials);
	mongoose.Promise = global.Promise;

	// register services
	app.configure(account);
	app.configure(analytics);
	app.configure(authentication);
	app.configure(calendar);
	app.configure(clipboard);
	app.configure(consent);
	app.configure(content);
	app.configure(federalState);
	app.configure(fileStorage);
	app.configure(helpdesk);
	app.configure(helpers);
	app.configure(homework);
	app.configure(ldap);
	app.configure(lesson);
	app.configure(link);
	app.configure(ltiTool);
	app.configure(me);
	app.configure(news);
	app.configure(notification);
	app.configure(passwordRecovery);
	app.configure(pseudonym);
	app.configure(releases);
	app.configure(resolve);
	app.configure(rocketChat);
	app.configure(role);
	app.configure(school);
	app.configure(statistic);
	app.configure(sync);
	app.configure(system);
	app.configure(teams);
	app.configure(timelines);
	app.configure(user);
	app.configure(userGroup);
	app.configure(wopi);

	// initialize events
	newsEvents.configure(app);
};
