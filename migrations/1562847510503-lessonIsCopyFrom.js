const mongoose = require('mongoose');
const L = require('../src/logger/');

const { Schema } = mongoose;

const { connect, close } = require('../src/utils/database');
const { OutputLogTemplate } = require('./helpers/');

const LessonModel = mongoose.model('lesson', new mongoose.Schema({
	isCopyFrom: { type: Schema.Types.ObjectId, default: null },
	originalTopic: { type: Schema.Types.ObjectId, ref: 'topic' },
}));

const isNotEmpty = e => !(e === undefined || e === null);

const createDatabaseTask = (collectionData, sourceKey, targetKey) => {
	const tasks = [];
	collectionData.forEach((lesson) => {
		if (isNotEmpty(lesson[sourceKey])) {
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
	return databaseTasks.map((task) => {
		const { _id, $set, $unset } = task;
		return LessonModel.updateOne({ _id }, { $set, $unset })
			.then(() => {
				return out.pushModified(task._id);
			})
			.catch(() => {
				return out.pushFail(task._id);
			});
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

		const out = new OutputLogTemplate({
			total: lessons.length,
			name: 'LessonCopyFrom',
		});

		const requests = await updateLessons(tasks, out);
		await Promise.all(requests);
		out.printResults();
		await close();
	},

	down: async function down() {
		await connect();
		const lessons = await LessonModel.find({}).lean().exec();
		const tasks = createDatabaseTask(lessons, 'isCopyFrom', 'originalTopic');

		const out = new OutputLogTemplate({
			total: lessons.length,
			name: 'LessonCopyFrom',
		});

		const requests = await updateLessons(tasks, out);
		await Promise.all(requests);
		out.printResults();
		await close();
	},
};
