const {
	Group,
	GroupToSingle,
	Lesson,
	Section,
	SubSections,
} = require('./handler/');
const { before, after, beforeLesson } = require('./hooks');

// subscriptions lesson->steps / , sections, group

module.exports = function setup() {
	const app = this;
	const route = '/editor/';

	app.use(`${route}sections`, new Section());
	app.use(`${route}groups`, new Group());
	app.use(`${route}lessons`, new Lesson());
	app.use(`${route}split`, new GroupToSingle());
	app.use(`${route}subsections`, new SubSections());

	const sections = app.service(`${route}sections`);
	sections.before(before);
	sections.after(after);

	const groups = app.service(`${route}groups`);
	groups.before(before);
	groups.after(after);

	const lessons = app.service(`${route}lessons`);
	lessons.before(beforeLesson);
	lessons.after(after);

	const split = app.service(`${route}split`);
	split.before(before);
	split.after(after);

	const subsections = app.service(`${route}subsections`);
	subsections.before(before);
	subsections.after(after);
};
