const hooks = require('./hooks/copy');
const errors = require('feathers-errors');
const HomeworkModel = require('./model').homeworkModel;
const _ = require('lodash');

class HomeworkCopyService {

	constructor(app) {
		this.app = app;
	}


	/**
	 * @param id = id of homework to copy
	 * @returns {new homework}
	 */
	get(id, params) {

        return HomeworkModel.findOne({_id: id}).exec()
			.then(copyAssignment => {
				let tempAssignment = JSON.parse(JSON.stringify(copyAssignment));
				tempAssignment = _.omit(tempAssignment, ['_id', 'stats', 'isTeacher', 'archived', '__v' ]);
				tempAssignment.private = true;
				tempAssignment.name = tempAssignment.name + " - Copy";

				return HomeworkModel.create(tempAssignment, (err, res) => {
					if (err)
						return err;
					else
						return res;
				});
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

		return HomeworkModel.findOne({ _id: data._id })
			.then(copyAssignment => {
				let tempAssignment = JSON.parse(JSON.stringify(copyAssignment));
				tempAssignment = _.omit(tempAssignment, ['_id', 'stats', 'isTeacher', 'archived', '__v', 'courseId', 'lessonId' ]);
				tempAssignment.courseId = data.courseId;
				tempAssignment.lessonId = data.lessonId;

				return this.app.service('users').get(userId)
					.then(user => {
						tempAssignment.schoolId = user.schoolId;
						tempAssignment.teacherId = user._id;

						return HomeworkModel.create(tempAssignment, (err, res) => {
							if (err)
								return err;
							else
								return res;
						});
					});
			});

	}

}

module.exports = function () {
	const app = this;

	// Initialize our service with any options it requires
	app.use('/homework/copy', new HomeworkCopyService(app));

	// Get our initialize service to that we can bind hooks
	const homeworkCopyService = app.service('/homework/copy');

	// Set up our before hooks
	homeworkCopyService.before(hooks.before);

	// Set up our after hooks
	homeworkCopyService.after(hooks.after);
};
