const L = require('../src/logger/');
const { connect, close } = require('../src/utils/database');
const LessonModel = require('../src/services/lesson/model');

const isUndefined = e => typeof e === 'undefined';

const getSortedLessons = async () => {
	L.info('<------ AddPositionToLessons ------>');
	L.info('fetch lessons..');
	const lessons = await LessonModel
		.find({})
		.sort({ position: 1 })
		.sort({ createdAt: 1 })
		.lean()
		.exec();

	// test sorting, it is important!
	if (lessons[0].createdAt > lessons[lessons.length - 1].createdAt) {
		throw new Error('please show sorting');
	}
	return lessons;
};

const createDataTree = (lessons, key) => {
	L.info(`create datatree ${key}`);
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

const createDatabaseTask = (datatree) => {
	L.info('create database tasks');
	const tasks = [];
	Object.values(datatree).forEach((courseLessons) => {
		courseLessons.forEach((lesson, index) => {
			/* is replaced
			let { position } = lesson;
			let modified = false;
			if (isUndefined(position) || isNull(position)) {
				position = index;
				modified = true;
			}
			*/
			/* In client the sorting is first null without number and after it the number from 1 to x */
			let modified = false;
			if (lesson.position === index) {
				modified = true;
			}
			const position = index;

			tasks.push({
				_id: lesson._id,
				modified,
				$set: { position },
			});
		});
	});
	return tasks;
};

const updateLessons = (databaseTasks, out) => {
	L.info(`update lessons in database tasks=${databaseTasks.length}`);
	databaseTasks.forEach((task) => {
		const { _id, $set } = task;
		const req = LessonModel.updateOne({ _id }, { $set })
			.then(() => {
				if (task.modified) {
					out.modified.push(task._id);
				} else {
					out.notModified.push(task._id);
				}
			})
			.catch(() => {
				out.fail.push(task._id);
			});
		out.requests.push(req);
	});
};

const printResults = out => Promise.all(out.requests).then(() => {
	L.info('\n');
	L.info(`modified:${out.modified.length}`);
	L.info(`notModified:${out.notModified.length}`);
	if (out.fail.length > 0) {
		L.warning(`fail:${out.fail.length}`);
		L.warning(out.fail);
	} else {
		L.info(`fail:${out.fail.length}`);
	}
	L.info('\n');
	L.info('AddPositionToLessons up is finished!');
	L.info('<---------------------------------->');
});

module.exports = {
	up: async function up() {
		await connect();

		// get sorted lessons
		const lessons = await getSortedLessons();

		// create course tree
		const courseMap = createDataTree(lessons, 'courseId');

		// create courseGroup tree courseMap.undefined contain all courseGroupLessons
		const courseGroupMap = createDataTree(courseMap.undefined, 'courseGroupId');
		delete courseMap.undefined;

		// add position if not exist, by oldest first | convert data to mongoose request
		const databaseTasks = createDatabaseTask(Object.assign(courseMap, courseGroupMap));

		// update database step by step
		const out = {
			modified: [],
			notModified: [],
			fail: [],
			requests: [],
		};

		updateLessons(databaseTasks, out);
		await printResults(out);
		await close();
	},

	down: async function down() {
		L.warning('Can not rollback data.');
	},
};
