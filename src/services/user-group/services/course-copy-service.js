// eslint-disable-next-line max-classes-per-file
const _ = require('lodash');
const { nanoid } = require('nanoid');

const { GeneralError, BadRequest } = require('../../../errors');
const hooks = require('../hooks/copyCourseHook');
const { courseModel } = require('../model');
const { homeworkModel } = require('../../homework/model');
const { LessonModel } = require('../../lesson/model');

const createHomework = (app, homework, courseId, userId) =>
	app.service('homework/copy').create({
		_id: homework._id,
		courseId,
		lessonId: undefined,
		userId,
		newTeacherId: homework.teacherId,
	});

const createLesson = (app, data) => app.service('lessons/copy').create(data);

class CourseCopyService {
	setup(app) {
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
		const { userId } = params.account || {};

		let tempData = JSON.parse(JSON.stringify(data));
		tempData = _.omit(tempData, ['_id', 'courseId', 'copyCourseId']);
		/* In the hooks some strange things happen, and the Id doesnt get here.
		Thats why we use copyCourseId (_id works in case of import)
		Todo: clean up different usecases */
		const sourceCourseId = data.copyCourseId || data._id; // blub... :-)
		const course = await courseModel.findOne({ _id: sourceCourseId }).lean().exec();

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

		tempCourse = Object.assign(tempCourse, tempData, { userId });
		tempCourse.isCopyFrom = sourceCourseId;

		const [newCourse, homeworks, lessons] = await Promise.all([
			this.app.service('courses').create(tempCourse),
			homeworkModel.find({ courseId: sourceCourseId }).populate('lessonId').lean().exec(), // why populate lesson ?!
			LessonModel.find({ courseId: sourceCourseId }).lean().exec(),
		]).catch((err) => {
			throw new GeneralError('Can not prepare data to copy the course.', { err });
		});

		// TODO: lesson and homework promise all can combined to reduce execution time
		// catch should add to createLesson and createHomework
		await Promise.all(
			lessons.map((lesson) =>
				createLesson(this.app, {
					lessonId: lesson._id,
					newCourseId: newCourse._id,
					userId,
					shareToken: lesson.shareToken,
				})
			)
		).catch((errors) => {
			throw new BadRequest('Can not copy one or many lessons.', { errors });
		});

		await Promise.all(
			homeworks.map((homework) => {
				// homeworks that are part of a lesson are copied in LessonCopyService
				if (!homework.lessonId) {
					return createHomework(this.app, homework, newCourse._id, userId);
				}
				return false;
			})
		).catch((errors) => {
			throw new BadRequest('Can not copy one or many homeworks.', { errors });
		});

		return newCourse;
	}
}

class CourseShareService {
	setup(app) {
		this.app = app;
	}

	// If provided with param shareToken then return course name
	async find(params) {
		const course = await courseModel.findOne({ shareToken: params.query.shareToken }).lean().exec();
		return course.name;
	}

	// otherwise create a shareToken for given courseId and the respective lessons.
	async get(id) {
		// Get Course and check for shareToken, if not found create one
		// Also check the corresponding lessons and add shareToken
		const course = await this.app.service('courses').get(id);
		if (!course.shareToken) {
			const lessons = await this.app.service('lessons').find({ query: { courseId: id } });
			for (let i = 0; i < lessons.data.length; i += 1) {
				if (!lessons.data[i].shareToken) {
					// Todo: logic must changed ..async operation without await or catch with logging can result in unhandled rejections.
					LessonModel.findByIdAndUpdate(lessons.data[i]._id, { shareToken: nanoid(12) })
						.lean()
						.exec();
				}
			}

			const shareToken = nanoid(12);
			await this.app.service('/courseModel').patch(id, { shareToken });
			return { shareToken };
		}
		return { shareToken: course.shareToken };
	}

	async create(data, params) {
		const { shareToken, courseName } = data;
		const { userId } = params.account || {};

		const [courses, user] = await Promise.all([
			courseModel.find({ shareToken }).lean().exec(),
			this.app.service('users').get(userId),
		]);

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

		tempCourse.schoolId = user.schoolId;
		tempCourse.userId = userId;

		const newCourse = await this.app.service('courses/copy').create(tempCourse);
		return newCourse;
	}
}

module.exports = (app) => {
	app.use('/courses/copy', new CourseCopyService());
	app.use('/courses-share', new CourseShareService());

	const courseCopyService = app.service('/courses/copy');
	const courseShareService = app.service('/courses-share');

	courseCopyService.hooks({
		before: hooks.before,
	});
	courseShareService.hooks({
		before: hooks.beforeShare,
	});
};
