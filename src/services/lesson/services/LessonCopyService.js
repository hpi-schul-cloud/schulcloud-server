// eslint-disable-next-line max-classes-per-file
const _ = require('lodash');

const { NotFound, GeneralError } = require('../../../errors');
const { homeworkModel } = require('../../homework/model');
const { FileModel } = require('../../fileStorage/model');
const lessonModel = require('../model');

const { copyFile } = require('../../fileStorage/utils');
const logger = require('../../../logger');

class FileChangeLog {
	constructor() {
		this.logs = [];
	}

	add(oldId, newId, name, char) {
		this.logs.push({
			old: `file=${oldId}${char}name=${name}`,
			new: `file=${newId}${char}name=${name}`,
		});
	}

	push(oldId, newId, name) {
		this.add(oldId, newId, name, '&');
		this.add(oldId, newId, name, '&amp;');
	}

	replaceAllInContent(content) {
		if (content.component !== 'text' || !content.content.text) {
			return content;
		}

		this.logs.forEach((change) => {
			content.content.text = content.content.text.replace(new RegExp(change.old, 'g'), change.new);
		});

		return content;
	}
}

class LessonCopyService {
	constructor(app) {
		this.app = app;
	}

	createHomeworkCopyTask(homework, userId, newCourseId, newLesson) {
		return this.app.service('homework/copy').create({
			_id: homework._id,
			courseId: newCourseId,
			lessonId: newLesson._id,
			userId: userId === homework.teacherId.toString() ? userId : homework.teacherId,
			newTeacherId: userId,
		});
	}

	async copyHomeworks(params, { _id: oldLessonId }, newCourseId, newLesson) {
		const userId = params.account.userId.toString();
		const homeworks = await homeworkModel
			.find({ lessonId: oldLessonId })
			.lean()
			.exec()
			.catch((err) => {
				throw new NotFound('Can not fetch homework data.', err);
			});
		const tasks = homeworks.map((h) => this.createHomeworkCopyTask(h, userId, newCourseId, newLesson));
		return Promise.all(tasks);
	}

	async copyFilesInLesson(params, sourceLesson, newCourseId, newLesson) {
		// get all course files
		const course = sourceLesson.courseId;
		const files = await FileModel.find({
			owner: course,
		})
			.lean()
			.exec();
		// filter files to lesson related
		const lessonFiles = files.filter((f) =>
			_.some(
				sourceLesson.contents || [],
				(content) =>
					content.component === 'text' && content.content.text && _.includes(content.content.text, f._id.toString())
			)
		);
		// copy files for new course
		const fileChangeLog = new FileChangeLog();
		await Promise.all(
			lessonFiles.map((sourceFile) =>
				copyFile(
					{
						file: sourceFile,
						parent: newCourseId,
						sourceSchoolId: course.schoolId,
					},
					params
				)
					.then((newFile) => {
						// /files/file?file=5d1ef687faccd3282cc94f83&amp;name=imago-images-fotos-von-voegeln.jpg\
						fileChangeLog.push(sourceFile._id, newFile._id, sourceFile.name);
					})
					.catch((err) => {
						logger.warning('Can not copy file', err);
						logger.warning({
							sourceFile,
							sourceLesson,
							newLesson,
							newCourseId,
						});
						fileChangeLog.push(sourceFile._id, `can_not_copyed_${sourceFile._id}`, sourceFile.name);
						return Promise.resolve();
					})
			)
		);

		newLesson.contents.forEach((content) => {
			fileChangeLog.replaceAllInContent(content);
		});
		return lessonModel.update({ _id: newLesson._id }, newLesson).lean().exec();
	}

	createTempLesson(sourceLesson, newCourseId) {
		let tempLesson = sourceLesson;
		tempLesson = _.omit(tempLesson, ['_id', 'shareToken', 'courseId']);
		tempLesson.courseId = newCourseId;
		tempLesson.isCopyFrom = sourceLesson._id;
		return tempLesson;
	}

	/**
	 * Clones a lesson to a specified course, including files and homeworks.
	 * @param data consists of lessonId and newCourseId (target, source).
	 * @param params user Object and other params.
	 * @returns newly created lesson.
	 */
	async create(data, params) {
		const { newCourseId, lessonId: _id } = data;
		const sourceLesson = await lessonModel
			.findOne({ _id })
			.populate('courseId')
			.lean()
			.exec()
			.catch((err) => {
				throw new NotFound('Can not fetch lesson.', err);
			});
		const tempLesson = this.createTempLesson(sourceLesson, newCourseId);
		const newLesson = await lessonModel.create(tempLesson).catch((err) => {
			throw new GeneralError('Can not create new lesson.', err);
		});

		return Promise.all([
			this.copyHomeworks(params, sourceLesson, newCourseId, newLesson),
			this.copyFilesInLesson(params, sourceLesson, newCourseId, newLesson),
		])
			.then(() => newLesson)
			.catch((err) => {
				logger.warning(err);
				throw err;
			});
	}
}

module.exports = LessonCopyService;
