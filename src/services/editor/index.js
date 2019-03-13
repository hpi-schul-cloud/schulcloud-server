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
	const permissionRoute = `${route}sections/:sectionId/permissions`;

	app.use(`${route}sections`, new Section());
	app.use(`${route}groups`, new Group());
	app.use(`${route}collections`, new Collection());
	app.use(`${route}lessons`, new Lesson());
	// app.use(`${route}split`, new GroupToSingle());
	// app.use(`${route}subsections`, new SubSection());
	app.use(permissionRoute, new Permission());

	const sections = app.service(`${route}sections`);
	sections.before(before);
	sections.after(after);

	const groups = app.service(`${route}groups`);
	groups.before(before);
	groups.after(after);

	const collections = app.service(`${route}collections`);
	collections.before(before);
	collections.after(after);

	const lessons = app.service(`${route}lessons`);
	lessons.before(beforeLesson);
	lessons.after(after);

	/* const split = app.service(`${route}split`);
	split.before(before);
	split.after(after); */

	/* const subsections = app.service(`${route}subsections`);
	subsections.before(before);
	subsections.after(after); */

	const permissions = app.service(permissionRoute);
	permissions.before(before);
	permissions.after(after);

	if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === undefined) {
		app.use(`${route}test`, new Test());
	}
};
