const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { Pad, Session, ActiveSessions, Group, Author } = require('./services');

const { padHooks, sessionHooks, activeSessionsHooks, groupHooks, authorHooks } = require('./hooks');

module.exports = (app) => {
	const padsRoute = '/etherpad/pads';
	const sessionRoute = '/etherpad/sessions';
	const activeSessionsRoute = '/etherpad/active-sessions';
	const groupRoute = '/etherpad/groups';
	const authorRoute = '/etherpad/authors';

	app.use('/etherpad/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	app.use(padsRoute, new Pad());
	app.use(sessionRoute, new Session());
	app.use(activeSessionsRoute, new ActiveSessions());
	app.use(groupRoute, new Group());
	app.use(authorRoute, new Author());

	const pads = app.service(padsRoute);
	const session = app.service(sessionRoute);
	const activeSessions = app.service(activeSessionsRoute);
	const group = app.service(groupRoute);
	const author = app.service(authorRoute);

	pads.hooks(padHooks);
	session.hooks(sessionHooks);
	group.hooks(groupHooks);
	activeSessions.hooks(activeSessionsHooks);
	author.hooks(authorHooks);
};
