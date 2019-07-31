const { FileModel } = require('../src/services/fileStorage/model');
const LessonModel = require('../src/services/lesson/model');
const { connect, close } = require('../src/utils/database');
const logger = require('../src/logger/');

const isUndefined = e => typeof e === 'undefined';

const createDataTree = (lessons = []) => {
	const map = {};
	lessons.forEach((lesson) => {
		const { courseId, _id, courseGroupId } = lesson;
		if (isUndefined(map[courseId])) {
			map[courseId] = {
				lessons: {},
				files: {},
			};
		}
		map[courseId].lessons[_id] = lesson;
	});
	return map;
};

module.exports = {
	up: async function up() {
		await connect();
		const [files, lessons] = await Promise.all([
			FileModel.find({}).lean().exec(),
			LessonModel.find({}).lean().exec(),
		]);
		const tree = createDataTree(lessons);
		await close();
	},
	down: async function down() {
		logger.warning('Down is not implemented.');
		await connect();
		await close();
	},
};
