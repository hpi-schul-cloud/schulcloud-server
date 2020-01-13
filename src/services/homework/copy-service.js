const _ = require('lodash');
const hooks = require('./hooks/copy');
const HomeworkModel = require('./model').homeworkModel;

class HomeworkCopyService {
	constructor(app) {
		this.app = app;
	}

	copy(obj, ignoreParams, addParams) {
		const temp = _.omit(JSON.parse(JSON.stringify(obj)), ignoreParams);
		return Object.assign(temp, addParams);
	}

	/**
     * @param id = id of homework to copy
     * @returns {new homework}
     */
	async get(id) {
		const ignoreParams = ['_id', 'stats', 'isTeacher', 'archived', '__v'];

		const copyAssignment = await HomeworkModel.findOne({ _id: id }).exec();

		const addParams = {
			private: true, // TODO: Soll das so sein?
			name: `${copyAssignment.name || ''} - Copy`,
		};

		const tempAssignment = this.copy(copyAssignment, ignoreParams, addParams);
		return HomeworkModel.create(tempAssignment);
	}

	/**
     * Copies a homework if the homework belongs to the user.
     * @param data consists of the _id to copy, can have courseId/lessonId to add to correct course/lesson.
     * @param params consists of information about the user.
     * @returns new homework.
     */
	async create({
		newTeacherId, _id, courseId, lessonId,
	}, params) {
		const userId = newTeacherId || params.payload.userId || (params.account || {}).userId;
		const ignoreParams = ['_id', 'stats', 'isTeacher', 'archived', '__v', 'courseId', 'lessonId'];

		const [copyAssignment, { schoolId, _id: teacherId }] = await Promise.all([
			HomeworkModel.findById(_id).exec(),
			this.app.service('users').get(userId),
		]);

		const addParams = {
			courseId, lessonId, schoolId, teacherId,
		};
		const tempAssignment = this.copy(copyAssignment, ignoreParams, addParams);

		return HomeworkModel.create(tempAssignment);
	}
}

module.exports = (app) => {
	app.use('/homework/copy', new HomeworkCopyService(app));
	const homeworkCopyService = app.service('/homework/copy');
	homeworkCopyService.hooks(hooks);
};
