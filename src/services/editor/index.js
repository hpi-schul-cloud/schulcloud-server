const {
	Group,
	GroupToSingle,
	Lesson,
	Section,
	SubSections,
} = require('./handler/');

// subscriptions lesson, sections, group

module.exports = function setup() {
	const app = this;

	app.use('/editor/sections', new Section());
	app.use('/editor/groups', new Group());
	app.use('/editor/lessons', new Lesson());
	app.use('/editor/split', new GroupToSingle());
	app.use('/editor/subsections', new SubSections());
};
