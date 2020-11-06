// eslint-disable-next-line max-classes-per-file
const _ = require('lodash');
const nanoid = require('nanoid');
const reqlib = require('app-root-path').require;

const { GeneralError } = reqlib('src/errors');
const logger = require('../../../logger');
const hooks = require('../hooks/copyCourseHook');
const { courseModel } = require('../model');
const { homeworkModel } = require('../../homework/model');
const lessonsModel = require('../../lesson/model');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;

const createHomework = (homework, courseId, lessonId, userId, app, newTeacherId) =>
	app
		.service('homework/copy')
		.create({
			_id: homework._id,
			courseId,
			lessonId,
			userId,
			newTeacherId,
		})
		.then((res) => res)
		.catch((err) => Promise.reject(err));

const createLesson = (app, data) => app.service('lessons/copy').create(data);

class CourseCopyService {
	constructor(app) {
		this.app = app;
	}

	/**
	 * Copies a course and copies homework and lessons of that course.
	 * @param data object consisting of name, color, teacherIds, classIds, userIds,
	 * .... everything you can edit or what is required by a course.
	 * @param params user Object and other params.
	 * @returns newly created course.
	 */
	async create(data, params) {
		let tempData = JSON.parse(JSON.stringify(data));
		tempData = _.omit(tempData, ['_id', 'courseId', 'copyCourseId']);
		/* In the hooks some strange things happen, and the Id doesnt get here.
		Thats why we use copyCourseId (_id works in case of import)
		Todo: clean up different usecases */
		const sourceCourseId = data.copyCourseId || data._id; // blub... :-)
		const course = await courseModel.findOne({ _id: sourceCourseId });

		let tempCourse = JSON.parse(JSON.stringify(course));
		const attributs = [
			'_id',
			'createdAt',
			'updatedAt',
			'__v',
			'name',
			'color',
			'teacherIds',
			'classIds',
			'userIds',
			'substitutionIds',
			'shareToken',
			'untilDate',
			'startDate',
			'times',
		];
		tempCourse = _.omit(tempCourse, attributs);

		tempCourse = Object.assign(tempCourse, tempData, { userId: (params.account || {}).userId });
		tempCourse.isCopyFrom = sourceCourseId;
		const res = await this.app.service('courses').create(tempCourse);

		const [homeworks, lessons] = await Promise.all([
			homeworkModel.find({ courseId: sourceCourseId }).populate('lessonId'),
			lessonsModel.find({ courseId: sourceCourseId }),
		]).catch((err) => {
			throw new GeneralError('Can not fetch data to copy this course.', err);
		});

		await Promise.all(
			lessons.map((lesson) =>
				createLesson(this.app, {
					lessonId: lesson._id,
					newCourseId: res._id,
					userId: params.account.userId,
					shareToken: lesson.shareToken,
				})
			)
		).catch((err) => {
			logger.warning(err);
			throw new GeneralError('Can not copy one or many lessons.', err);
		});

		await Promise.all(
			homeworks.map((homework) => {
				// homeworks that are part of a lesson are copied in LessonCopyService
				if (!homework.lessonId) {
					return createHomework(
						homework,
						res._id,
						undefined,
						equalIds(params.account.userId, homework.teacherId) ? params.account.userId : homework.teacherId,
						this.app,
						params.account.userId
					);
				}
				return false;
			})
		).catch((err) => {
			throw new GeneralError('Can not copy one or many homeworks.', err);
		});

		return res;
	}
}

class CourseShareService {
	constructor(app) {
		this.app = app;
	}

	// If provided with param shareToken then return course name
	find(params) {
		return courseModel.findOne({ shareToken: params.query.shareToken }).then((course) => course.name);
	}

	// otherwise create a shareToken for given courseId and the respective lessons.
	async get(id, params) {
		const coursesService = this.app.service('courses');
		const lessonsService = this.app.service('lessons');

		// Get Course and check for shareToken, if not found create one
		// Also check the corresponding lessons and add shareToken
		const course = coursesService.get(id);
		if (!course.shareToken) {
			const lessons = await lessonsService.find({ query: { courseId: id } });
			for (let i = 0; i < lessons.data.length; i += 1) {
				if (!lessons.data[i].shareToken) {
					lessonsModel.findByIdAndUpdate(lessons.data[i]._id, { shareToken: nanoid(12) }).exec();
				}
			}

			return this.app
				.service('/courseModel')
				.patch(id, { shareToken: nanoid(12) })
				.then((res) => ({ shareToken: res.shareToken }));
		}
		return { shareToken: course.shareToken };
	}

	create(data, params) {
		const { shareToken } = data;
		const { userId } = params.account || {};
		const { courseName } = data;
		const copyService = this.app.service('courses/copy');

		return courseModel.find({ shareToken }).then((courses) => {
			const course = courses[0];
			let tempCourse = JSON.parse(JSON.stringify(course));
			tempCourse = _.omit(tempCourse, [
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
			]);

			tempCourse.teacherIds = [userId];

			if (courseName) {
				tempCourse.name = courseName;
			}

			return this.app
				.service('users')
				.get(userId)
				.then((user) => {
					tempCourse.schoolId = user.schoolId;
					tempCourse.userId = userId;

					return copyService
						.create(tempCourse)
						.then((res) => res)
						.catch((err) => err);
				});
		});
	}
}

module.exports = function setup() {
	const app = this;

	app.use('/courses/copy', new CourseCopyService(app));
	app.use('/courses-share', new CourseShareService(app));

	const courseCopyService = app.service('/courses/copy');
	const courseShareService = app.service('/courses-share');

	courseCopyService.hooks({
		before: hooks.before,
	});
	courseShareService.hooks({
		before: hooks.beforeShare,
	});
};
