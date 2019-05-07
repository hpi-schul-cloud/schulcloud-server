const {
	Group,
	Collection,
	// GroupToSingle,
	Lesson,
	Section,
	Attachment,
	// SubSection,
	Permission,
	Test,
} = require('./services/');
const { before, after, beforeLesson } = require('./hooks');
const { setForceKey } = require('./helper');

// subscriptions lesson->steps / , sections, group

module.exports = function setup() {
	const app = this;
	const route = '/editor/';

	setForceKey(app);

	const permissionsRoute = `${route}sections/:sectionId/permissions`;
	const groupsRoute = `${route}groups`;
	const sectionsRoute = `${route}sections`;
	const attachmentsRoute = `${route}attachments`;
	const collectionsRoute = `${route}collections`;
	const lessonsRoute = `${route}lessons`;
	// const subsectionsRoute = `${route}subsections`;
	app.use(sectionsRoute, new Section());
	app.use(attachmentsRoute, new Attachment());
	app.use(groupsRoute, new Group());
	app.use(collectionsRoute, new Collection());
	app.use(lessonsRoute, new Lesson());
	// app.use(`${route}split`, new GroupToSingle());
	// app.use(subsectionsRoute, new SubSection());
	app.use(permissionsRoute, new Permission());

	const hooks = { before, after };
	const sections = app.service(sectionsRoute);
	sections.hooks(hooks);

	const attachments = app.service(attachmentsRoute);
	attachments.hooks(hooks);

	const groups = app.service(groupsRoute);
	groups.hooks(hooks);

	const collections = app.service(collectionsRoute);
	collections.hooks(hooks);

	const lessons = app.service(lessonsRoute);
	lessons.hooks({
		before: beforeLesson,
		after,
	});

	/* const split = app.service(`${route}split`);
	split.hooks(hooks); */

	/* const subsections = app.service(subsectionsRoute);
	subsections.hooks(hooks); */

	const permissions = app.service(permissionsRoute);
	permissions.hooks(hooks);

	if (['default', 'local', 'test'].includes(process.env.NODE_ENV)) {
		app.use(`${route}test`, new Test());
	}
};
