const {
	Author,
	AuthorHooks,
} = require('./Author');

const {
	Group,
	GroupHooks,
} = require('./Group');

const {
	Pad,
	PadHooks,
} = require('./Pad');

const {
	Session,
	SessionHooks,
} = require('./Session');


module.exports = (app) => {
	const padsRoute = '/etherpad/pads';
	const sessionRoute = '/etherpad/sessions';
	const groupRoute = '/etherpad/groups';
	const authorRoute = '/etherpad/authors';

	app.use(padsRoute, new Pad());
	app.use(sessionRoute, new Session());
	app.use(groupRoute, new Group());
	app.use(authorRoute, new Author());

	const pads = app.service(padsRoute);
	const session = app.service(sessionRoute);
	const group = app.service(groupRoute);
	const author = app.service(authorRoute);

	pads.hooks(PadHooks);
	session.hooks(SessionHooks);
	group.hooks(GroupHooks);
	author.hooks(AuthorHooks);
};
