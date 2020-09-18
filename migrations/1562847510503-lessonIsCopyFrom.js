const mongoose = require('mongoose');

const { Schema } = mongoose;

const { connect, close } = require('../src/utils/database');
const { OutputLogTemplate, DatabaseTaskTemplate } = require('./helpers');

const LessonModel = mongoose.model(
	'lessonNew',
	new mongoose.Schema({
		isCopyFrom: { type: Schema.Types.ObjectId, default: null },
		originalTopic: { type: Schema.Types.ObjectId, ref: 'topic' },
	}),
	'lesson'
);

const isNotEmpty = (e) => !(e === undefined || e === null);

const createDatabaseTask = (collectionData, sourceKey, targetKey) => {
	const tasks = [];
	collectionData.forEach((lesson) => {
		if (isNotEmpty(lesson[sourceKey])) {
			tasks.push(
				new DatabaseTaskTemplate({
					id: lesson._id,
					set: { [targetKey]: lesson[sourceKey] },
					unset: { [sourceKey]: 1 },
				})
			);
		}
	});
	return tasks;
};

module.exports = {
	up: async function up() {
		await connect();
		const lessons = await LessonModel.find({}).lean().exec();
		const tasks = createDatabaseTask(lessons, 'originalTopic', 'isCopyFrom');

		const out = new OutputLogTemplate({
			total: lessons.length,
			name: 'LessonCopyFrom',
		});

		await Promise.all(tasks.map((task) => task.exec(LessonModel, 'updateOne', out)));
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

		await Promise.all(tasks.map((task) => task.exec(LessonModel, 'updateOne', out)));
		out.printResults();
		await close();
	},
};
