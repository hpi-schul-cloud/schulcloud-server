const _ = require('lodash');
const nanoid = require('nanoid');
const hooks = require('./hooks/copyCourseHook');
const { courseModel } = require('./model');
const { homeworkModel } = require('../homework/model');
const lessonsModel = require('../lesson/model');

const createHomework = (homework, courseId, lessonId, userId, app, newTeacherId) => app.service('homework/copy')
	.create({
		_id: homework._id, courseId, lessonId, userId, newTeacherId,
	})
	.then(res => res)
	.catch(err => Promise.reject(err));

const createLesson = (lessonId, newCourseId, userId, app, shareToken) => app.service('lessons/copy').create({
	lessonId, newCourseId, userId, shareToken,
})
	.then(res => res)
	.catch(err => Promise.reject(err));

class CourseCopyService {
	constructor(app) {
		this.app = app;
	}

	/**
     * Copies a course and copies homework and lessons of that course.
     * @param data object consisting of name, color, teacherIds, classIds, userIds, .... everything you can edit or what is required by a course.
     * @param params user Object and other params.
     * @returns newly created course.
     */
	create(data, params) {
		let tempData = JSON.parse(JSON.stringify(data));
		tempData = _.omit(tempData, ['_id', 'courseId']);

		return courseModel.findOne({ _id: data._id })
			.then((course) => {
				let tempCourse = JSON.parse(JSON.stringify(course));
				tempCourse = _.omit(tempCourse, ['_id', 'createdAt', 'updatedAt', '__v', 'name', 'color', 'teacherIds', 'classIds', 'userIds', 'substitutionIds', 'shareToken', 'untilDate', 'startDate', 'times']);

				tempCourse = Object.assign(tempCourse, tempData, { userId: (params.account || {}).userId });

				return this.app.service('courses').create(tempCourse)
					.then((res) => {
						const homeworkPromise = homeworkModel.find({ courseId: data._id }).populate('lessonId');
						const lessonsPromise = lessonsModel.find({ courseId: data._id });

						return Promise.all([homeworkPromise, lessonsPromise])
							.then(([homeworks, lessons]) => {
								const createdLessons = [];

								return Promise.all(lessons.map(lesson => createLesson(lesson._id, res._id, params.account.userId, this.app, lesson.shareToken)
									.then((lessonRes) => {
										createdLessons.push({ _id: lessonRes._id, name: lessonRes.name });
									})))
									.then(() => Promise.all(homeworks.map((homework) => {
										if (homework.archived.length > 0
											|| (homework.teacherId.toString() !== params.account.userId.toString()
												&& homework.private)) return false;
										// homeworks that are part of a lesson are copied in LessonCopyService
										if (!homework.lessonId) {
											return createHomework(
												homework,
												res._id,
												undefined,
												params.account.userId.toString() === homework.teacherId.toString()
													? params.account.userId : homework.teacherId,
												this.app,
												params.account.userId,
											);
										}
										return false;
									}))
										.then(() => res));
							});
					});
			});
	}
}

class CourseShareService {
	constructor(app) {
		this.app = app;
	}

	// If provided with param shareToken then return course name
	find(params) {
		return courseModel.findOne({ shareToken: params.query.shareToken })
			.then(course => course.name);
	}

	// otherwise create a shareToken for given courseId and the respective lessons.
	get(id, params) {
		const coursesService = this.app.service('courses');
		const lessonsService = this.app.service('lessons');

		// Get Course and check for shareToken, if not found create one
		// Also check the corresponding lessons and add shareToken
		return coursesService.get(id)
			.then((course) => {
				if (!course.shareToken) {
					lessonsService.find({ query: { courseId: id } })
						.then((lessons) => {
							for (let i = 0; i < lessons.data.length; i += 1) {
								if (!lessons.data[i].shareToken) {
									lessonsModel.findByIdAndUpdate(lessons.data[i]._id, { shareToken: nanoid(12) })
										.then((_) => {
										});
								}
								return;
							}
						});

					return coursesService.patch(id, { shareToken: nanoid(12) })
						.then(res => ({ shareToken: res.shareToken }));
				}

				return { shareToken: course.shareToken };
			});
	}

	create(data, params) {
		const { shareToken } = data;
		const { userId } = params.account || {};
		const { courseName } = data;
		const copyService = this.app.service('courses/copy');

		return courseModel.find({ shareToken })
			.then((course) => {
				course = course[0];
				let tempCourse = JSON.parse(JSON.stringify(course));
				tempCourse = _.omit(
					tempCourse,
					[
						'createdAt',
						'updatedAt',
						'__v',
						'teacherIds',
						'classIds',
						'userIds',
						'substitutionIds',
						'shareToken',
						'schoolId',
						'untilDate',
						'startDate',
						'times',
					],
				);

				tempCourse.teacherIds = [userId];

				if (courseName) {
					tempCourse.name = courseName;
				}

				return this.app.service('users').get(userId)
					.then((user) => {
						tempCourse.schoolId = user.schoolId;
						tempCourse.userId = userId;

						return copyService.create(tempCourse)
							.then(res => res)
							.catch(err => err);
					});
			});
	}
}

module.exports = function setup() {
	const app = this;

	app.use('/courses/copy', new CourseCopyService(app));
	app.use('/courses/share', new CourseShareService(app));

	const courseCopyService = app.service('/courses/copy');
	const courseShareService = app.service('/courses/share');

	courseCopyService.hooks({
		before: hooks.before,
	});
	courseShareService.hooks({
		before: hooks.beforeShare,
	});
};
