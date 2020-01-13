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
	get(id) {
		const ignoreParams = ['_id', 'stats', 'isTeacher', 'archived', '__v'];
		const addParams = {
			private: true,
			name: ' - Copy',
		};

		return HomeworkModel.findOne({ _id: id }).exec()
			.then((copyAssignment) => {
				const tempAssignment = this.copy(copyAssignment, ignoreParams, addParams);
				return HomeworkModel.create(tempAssignment);
			});
	}

	/**
     * Copies a homework if the homework belongs to the user.
     * @param data consists of the _id to copy, can have courseId/lessonId to add to correct course/lesson.
     * @param params consists of information about the user.
     * @returns new homework.
     */
	create({
		newTeacherId, _id, courseId, lessonId,
	}, params) {
		const userId = newTeacherId || params.payload.userId || (params.account || {}).userId;
		const ignoreParams = ['_id', 'stats', 'isTeacher', 'archived', '__v', 'courseId', 'lessonId'];

		return HomeworkModel.findById(_id).exec()
			.then(async (copyAssignment) => {
				const { schoolId, _id: teacherId } = await this.app.service('users').get(userId);
				const addParams = {
					courseId, lessonId, schoolId, teacherId,
				};
				const tempAssignment = this.copy(copyAssignment, ignoreParams, addParams);

				return HomeworkModel.create(tempAssignment);
			});
	}
}

module.exports = (app) => {
	app.use('/homework/copy', new HomeworkCopyService(app));
	const homeworkCopyService = app.service('/homework/copy');
	homeworkCopyService.hooks(hooks);
};
