const {
	Group,
	GroupToSingle,
	Lesson,
	Section,
	SubSections,
} = require('./handler/');
const { before, after } = require('./hooks');

// subscriptions lesson->steps / , sections, group

module.exports = function setup() {
	const app = this;

	app.use('/editor/sections', new Section());
	app.use('/editor/groups', new Group());
	app.use('/editor/lessons', new Lesson());
	app.use('/editor/split', new GroupToSingle());
	app.use('/editor/subsections', new SubSections());

	const sections = app.service('/editor/sections');
	sections.before(before);
	sections.after(after);

	const groups = app.service('/editor/groups');
	groups.before(before);
	groups.after(after);

	const lessons = app.service('/editor/lessons');
	lessons.before(before);
	lessons.after(after);

	const split = app.service('/editor/split');
	split.before(before);
	split.after(after);

	const subsections = app.service('/editor/subsections');
	subsections.before(before);
	subsections.after(after);
};
