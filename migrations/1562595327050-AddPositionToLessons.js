const L = require('../src/logger/');
const { connect, close } = require('../src/utils/database');
const lessonsModel = require('../src/services/lesson/model');

const isUndefined = e => typeof e === 'undefined';
const isNull = e => e === null || e === 'null';

const getSortedLessons = async (self) => {
	const lessons = await self('lesson')
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

const createDataTree = (lessons, map, key) => {
	lessons.forEach((lesson) => {
		const id = lesson[key];
		if (isUndefined(map[id])) {
			map[id] = [];
		}
		map[id].push(lesson);
	});
};

const createDatabaseTask = (datatree, databaseTasks) => {
	Object.values(datatree).forEach((courseLessons) => {
		courseLessons.forEach((lesson, index) => {
			let { position } = lesson;
			let modified = false;
			if (isUndefined(position) || isNull(position)) {
				position = index;
				modified = true;
			}

			databaseTasks.push({
				_id: lesson._id,
				modified,
				$set: { position },
			});
		});
	});
};

const updateLessons = (self, databaseTasks, out) => {
	databaseTasks.forEach((task) => {
		const { _id, $set } = task;
		const req = self('lesson').updateOne({ _id }, { $set })
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
		L.info('<---------------------------------->');
		L.info('AddPositionToLessons up is starting...');

		// get sorted lessons
		const lessons = await getSortedLessons(this);

		// create course tree
		const courseMap = {};
		createDataTree(lessons, courseMap, 'courseId');

		// create courseGroup tree courseMap.undefined contain all courseGroupLessons
		const courseGroupMap = {};
		createDataTree(courseMap.undefined, courseGroupMap, 'courseGroupId');
		delete courseMap.undefined;

		// add position if not exist, by oldest first | convert data to mongoose request
		const databaseTasks = [];
		createDatabaseTask(Object.assign(courseMap, courseGroupMap), databaseTasks);

		// update database step by step
		const out = {
			modified: [],
			notModified: [],
			fail: [],
			requests: [],
		};

		updateLessons(this, databaseTasks, out);
		await printResults(out);
		await close();
	},

	down: async function down() {
		L.warning('Can not rollback data.');
	},
};
