const {
	Group,
	Collection,
	GroupToSingle,
	Lesson,
	Section,
	SubSection,
	Permission,
	Test,
} = require('./services/');
const { before, after, beforeLesson } = require('./hooks');

// subscriptions lesson->steps / , sections, group

module.exports = function setup() {
	const app = this;
	const route = '/editor/';
	
	const permissionsRoute = `${route}sections/:sectionId/permissions`;
	const groupsRoute = `${route}groups`;
	const sectionsRoute = `${route}sections`;
	const collectionsRoute = `${route}collections`;
	const lessonsRoute = `${route}lessons`;
	const subsectionsRoute = `${route}subsections`;

	app.use(sectionsRoute, new Section());
	app.use(groupsRoute, new Group());
	app.use(collectionsRoute, new Collection());
	app.use(lessonsRoute, new Lesson());
	// app.use(`${route}split`, new GroupToSingle());
	// app.use(subsectionsRoute, new SubSection());
	app.use(permissionsRoute, new Permission());

	const sections = app.service(sectionsRoute);
	sections.before(before);
	sections.after(after);

	const groups = app.service(groupsRoute);
	groups.before(before);
	groups.after(after);

	const collections = app.service(collectionsRoute);
	collections.before(before);
	collections.after(after);

	const lessons = app.service(lessonsRoute);
	lessons.before(beforeLesson);
	lessons.after(after);

	/* const split = app.service(`${route}split`);
	split.before(before);
	split.after(after); */

	/* const subsections = app.service(subsectionsRoute);
	subsections.before(before);
	subsections.after(after); */

	const permissions = app.service(permissionsRoute);
	permissions.before(before);
	permissions.after(after);

	if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === undefined) {
		app.use(`${route}test`, new Test());
	}
};
