const _ = require('lodash');
const hooks = require('./hooks/copy');
const HomeworkModel = require('./model').homeworkModel;

class HomeworkCopyService {
	constructor(app) {
		this.app = app;
	}

	copyObject(obj) {
		return JSON.parse(JSON.stringify(obj));
	}

	/**
     * @param id = id of homework to copy
     * @returns {new homework}
     */
	get(id) {
		const ignoreParams = ['_id', 'stats', 'isTeacher', 'archived', '__v'];

		return HomeworkModel.findOne({ _id: id }).exec()
			.then((copyAssignment) => {
				let tempAssignment = this.copyObject(copyAssignment);
				tempAssignment = _.omit(tempAssignment, ignoreParams);
				tempAssignment.private = true;
				tempAssignment.name += ' - Copy';

				return HomeworkModel.create(tempAssignment);
			});
	}

	/**
     * Copies a homework if the homework belongs to the user.
     * @param data consists of the _id to copy, can have courseId/lessonId to add to correct course/lesson.
     * @param params consists of information about the user.
     * @returns new homework.
     */
	create(data, params) {
		const userId = data.newTeacherId || params.payload.userId || (params.account || {}).userId;
		const ignoreParams = ['_id', 'stats', 'isTeacher', 'archived', '__v', 'courseId', 'lessonId'];

		return HomeworkModel.findById(data._id).exec()
			.then((copyAssignment) => {
				let tempAssignment = this.copyObject(copyAssignment);
				tempAssignment = _.omit(tempAssignment, ignoreParams);
				tempAssignment.courseId = data.courseId;
				tempAssignment.lessonId = data.lessonId;

				return this.app.service('users').get(userId)
					.then((user) => {
						tempAssignment.schoolId = user.schoolId;
						tempAssignment.teacherId = user._id;

						return HomeworkModel.create(tempAssignment);
					});
			});
	}
}

module.exports = (app) => {
	app.use('/homework/copy', new HomeworkCopyService(app));
	const homeworkCopyService = app.service('/homework/copy');
	homeworkCopyService.hooks(hooks);
};
