const logger = require('../src/logger');
const { connect, close } = require('../src/utils/database');
const { LessonModel } = require('../src/services/lesson/model');
const { OutputLogTemplate, DatabaseTaskTemplate } = require('./helpers');

const isUndefined = (e) => typeof e === 'undefined';

const getSortedLessons = async () => LessonModel.find({}).sort({ position: 1 }).sort({ createdAt: 1 }).lean().exec();

const createDataTree = (lessons = [], key) => {
	logger.info(`create datatree ${key}`);
	const map = {};
	lessons.forEach((lesson) => {
		const id = lesson[key];
		if (isUndefined(map[id])) {
			map[id] = [];
		}
		map[id].push(lesson);
	});
	return map;
};

const createDatabaseTask = (datatree = []) => {
	const tasks = [];
	Object.values(datatree).forEach((courseLessons) => {
		courseLessons.forEach((lesson, index) => {
			/* In client the sorting is first null without number and after it the number from 1 to x */
			tasks.push(
				new DatabaseTaskTemplate({
					id: lesson._id,
					isModified: lesson.position !== index,
					set: { position: index },
				})
			);
		});
	});
	return tasks;
};

module.exports = {
	up: async function up() {
		await connect();

		const lessons = await getSortedLessons();

		// create course tree
		const courseMap = createDataTree(lessons, 'courseId');

		// create courseGroup tree courseMap.undefined contain all courseGroupLessons
		const courseGroupMap = createDataTree(courseMap.undefined, 'courseGroupId');
		delete courseMap.undefined;

		// update database step by step
		const out = new OutputLogTemplate({
			total: lessons.length,
			name: 'AddPositionToLessons',
		});
		// add position if not exist, by oldest first | convert data to mongoose request
		const databaseTasks = createDatabaseTask(Object.assign(courseMap, courseGroupMap));

		await Promise.all(databaseTasks.map((task) => task.exec(LessonModel, 'updateOne', out)));
		out.printResults();
		await close();
	},

	down: async function down() {
		logger.warning('Can not rollback data.');
	},
};
