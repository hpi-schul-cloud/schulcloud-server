const mongoose = require('mongoose');
const L = require('../src/logger/');

const { Schema } = mongoose;

const { connect, close } = require('../src/utils/database');

const LessonModel = mongoose.model('lesson', new mongoose.Schema({
	isCopyFrom: { type: Schema.Types.ObjectId, default: null },
	originalTopic: { type: Schema.Types.ObjectId, ref: 'topic' },
}));

const isNotEmpty = e => !(e === undefined || e === null);

const createDatabaseTask = (collectionData, sourceKey, targetKey) => {
	const tasks = [];
	collectionData.forEach((lesson) => {
		if (isNotEmpty(lesson.originalTopic)) {
			tasks.push({
				_id: lesson._id,
				$set: {
					[targetKey]: lesson[sourceKey],
				},
				$unset: {
					[sourceKey]: 1,
				},
			});
		}
	});
	return tasks;
};

const updateLessons = (databaseTasks, out) => {
	L.info(`update lessons in database tasks=${databaseTasks.length}`);
	databaseTasks.forEach((task) => {
		const { _id, $set, $unset } = task;
		const req = LessonModel.updateOne({ _id }, { $set, $unset })
			.then(() => {
				out.modified.push(task._id);
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
	L.info(`notModified:${out.total - out.modified.length - out.fail.length}`);
	if (out.fail.length > 0) {
		L.warning(`fail:${out.fail.length}`);
		L.warning(out.fail);
	} else {
		L.info(`fail:${out.fail.length}`);
	}
	L.info('\n');
	L.info('LessonCopyFrom up is finished!');
	L.info('<---------------------------------->');
});

module.exports = {
	up: async function up() {
		await connect();
		const lessons = await LessonModel.find({}).lean().exec();
		const tasks = createDatabaseTask(lessons, 'originalTopic', 'isCopyFrom');

		// update database step by step
		const out = {
			modified: [],
			notModified: [],
			fail: [],
			requests: [],
		};

		await updateLessons(tasks, out);
		await printResults(out);
		await close();
	},

	down: async function down() {
		await connect();
		const lessons = await LessonModel.find({}).lean().exec();
		const tasks = createDatabaseTask(lessons, 'isCopyFrom', 'originalTopic');
		const out = {
			modified: [],
			total: lessons.length,
			fail: [],
			requests: [],
		};
		await updateLessons(tasks, out);
		await printResults(out);
		await close();
	},
};
