const hooks = require('./hooks/copyCourseHook');
const errors = require('feathers-errors');
const courseModel = require('./model').courseModel;
const homeworkModel = require('../homework/model').homeworkModel;
const lessonsModel = require('../lesson/model');
const _ = require('lodash');

class CourseCopyService {

	constructor(app) {
		this.app = app;
	}

	create(data, params) {
		let tempData = JSON.parse(JSON.stringify(data));
		tempData = _.omit(tempData, ['_id']);

		return courseModel.findOne({_id: data._id}).exec()
			.then(initCourse => {
				let tempCourse = JSON.parse(JSON.stringify(initCourse));
				tempCourse = _.omit(tempCourse, ['_id', 'createdAt', 'updatedAt', '__v', 'name', 'color', 'teacherIds','classIds','userIds','substitutionIds']);

				tempCourse = Object.assign(tempCourse, tempData);

				return courseModel.create(tempCourse, (err, res) => {
					if (err)
						return err;
					else {
						let homeworkPromise = homeworkModel.find({courseId: data._id});
						let lessonsPromise = lessonsModel.find({courseId: data._id});

						Promise.all([homeworkPromise, lessonsPromise])
							.then(([homeworks, lessons]) => {
								lessons.forEach(lesson => {
									this.app.service('/lessons/copy').create({
										lessonId: lesson._id,
										newCourseId: res._id,
										courseId: data._id,
										userId: params.account.userId
									});
								});

							});
					}
				});
				});
		}

}

module.exports = function () {
	const app = this;

	// Initialize our service with any options it requires
	app.use('/courses/copy', new CourseCopyService(app));

	// Get our initialize service to that we can bind hooks
	const courseCopyService = app.service('/courses/copy');

	// Set up our before hooks
	courseCopyService.before(hooks.before);
};
