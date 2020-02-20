const fileStorage = require('./fileStorage');
const link = require('./link');
const news = require('./news');
const newsEvents = require('./news/events');
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
const userGroup = require('./user-group');
const teams = require('./teams');
const teamEvents = require('./teams/events');
const homework = require('./homework');
const passwordRecovery = require('./passwordRecovery');
const notification = require('./notification');
const releases = require('./releases');
const helpdesk = require('./helpdesk');
const statistic = require('./statistic');
const wopi = require('./wopi');
const pseudonym = require('./pseudonym');
const consent = require('./consent');
const oauth2 = require('./oauth2');
const roster = require('./roster');
const ldap = require('./ldap');
const sync = require('./sync');
const datasources = require('./datasources');
const rocketChat = require('./rocketChat');
const clipboard = require('./clipboard');
const webuntis = require('./webuntis');
const me = require('./me');
const help = require('./help');
const database = require('../utils/database');
const videoconference = require('./videoconference');


module.exports = function initializeServices() {
	const app = this;

	// connect mongoose to the database
	database.connect();

	// register services
	app.configure(authentication);
	app.configure(analytics);
	app.configure(user);
	app.configure(role);
	app.configure(account);
	app.configure(system);
	app.configure(school);
	app.configure(resolve);
	app.configure(userGroup);
	app.configure(teams);
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
	app.configure(passwordRecovery);
	app.configure(notification);
	app.configure(releases);
	app.configure(helpdesk);
	app.configure(statistic);
	app.configure(wopi);
	app.configure(pseudonym);
	app.configure(consent);
	app.configure(clipboard);
	app.configure(ldap);
	app.configure(sync);
	app.configure(me);
	app.configure(help);
	app.configure(rocketChat);
	app.configure(oauth2);
	app.configure(roster);
	app.configure(datasources);
	app.configure(webuntis);
	app.configure(videoconference);


	// initialize events
	newsEvents.configure(app);
	teamEvents.configure(app);
};
