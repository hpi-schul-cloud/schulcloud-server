const _ = require('lodash');
const { NotFound, GeneralError, BadRequest } = require('@feathersjs/errors');
const service = require('feathers-mongoose');
const lessonModel = require('./model');
const hooks = require('./hooks/index');
const copyHooks = require('./hooks/copy');
const { FileModel } = require('../fileStorage/model');
const { homeworkModel } = require('../homework/model');
const { copyFile } = require('../fileStorage/utils/');

class LessonFilesService {
	isTextContent(content) {
		return content.component === 'text' && content.content.text;
	}

	includeFileKey(content, fileKey) {
		return _.includes(content.content.text, fileKey);
	}

	replaceFileLinksByFileId(files = [], lesson) {
		const contents = lesson.contents || [];
		return files.filter(file => _.some(contents,
			c => this.isTextContent(c) && this.includeFileKey(c, file.key)));
	}

	/**
     * @returns all files which are included in text-components of a given lesson
     * @param lessonId
     * @param query contains shareToken
     */
	find({ lessonId, query }) {
		const { shareToken } = query;
		if (!lessonId || !shareToken) throw new BadRequest('Missing parameters!');

		// first fetch lesson from given id
		return lessonModel.findOne({ _id: lessonId, shareToken }).then((lesson) => {
			if (!lesson) {
				throw new NotFound('No lesson was not found for given lessonId and shareToken!');
			}
			// fetch files in the given course and check whether they are included in the lesson
			// check whether the file is included in any lesson
			return FileModel.find({ path: { $regex: lesson.courseId } })
				.then(files => this.replaceFileLinksByFileId(files, lesson));
		});
	}
}

class LessonCopyService {
	constructor(app) {
		this.app = app;
	}

	testIfHomeworkShouldCopy(homework, userId) {
		const isArchived = homework.archived.length > 0;
		const isNotTeacher = homework.teacherId.toString() !== userId;
		const isPrivate = homework.private;
		return isArchived || (isNotTeacher && isPrivate);
	}

	createHomeworkCopyTask(homework, userId, newCourseId, newLesson) {
		if (this.testIfHomeworkShouldCopy(homework, userId)) {
			return false;
		}

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
		const homeworks = await homeworkModel.find({ oldLessonId })
			.lean()
			.exec()
			.catch((err) => {
				throw new NotFound('Can not fetch homework data.', err);
			});
		const tasks = homeworks.map(h => this.createHomeworkCopyTask(h, userId, newCourseId, newLesson));
		return Promise.all(tasks);
	}

	async copyFilesInLesson(params, sourceLesson, newCourseId, newLesson) {
		const fileChangelog = [];
		// get all course files
		const files = await FileModel.find({
			owner: sourceLesson.courseId,
		});
		// filter files to lesson related
		const lessonFiles = files.filter(f => _.some(
			(sourceLesson.contents || []),
			content => content.component === 'text'
				&& content.content.text
				&& _.includes(content.content.text, f._id.toString()),
		));
		// copy files for new course
		await Promise.all(lessonFiles.map((sourceFile) => {
			const fileData = {
				file: sourceFile._id,
				parent: newCourseId,
			};

			return copyFile(fileData, params)
				.then((newFile) => {
					// /files/file?file=5d1ef687faccd3282cc94f83&amp;name=imago-images-fotos-von-voegeln.jpg\
					fileChangelog.push({
						old: `file=${sourceFile._id}&amp;name=${sourceFile.name}`,
						new: `file=${newFile._id}&amp;name=${newFile.name}`,
					});
				});
		}));
		// replace file ids in lesson content
		newLesson.contents.forEach((content) => {
			if (content.component === 'text' && content.content.text) {
				fileChangelog.forEach((change) => {
					content.content.text = content.content.text.replace(
						new RegExp(change.old, 'g'),
						change.new,
					);
				});
			}
		});
		// update lesson data
		return lessonModel.update({ _id: newLesson._id }, newLesson);
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
		const sourceLesson = await lessonModel.findOne({ _id })
			.populate('courseId')
			.lean()
			.exec()
			.catch((err) => {
				throw new NotFound('Can not fetch lesson.', err);
			});
		const tempLesson = this.createTempLesson(sourceLesson, newCourseId);
		const newLesson = await lessonModel.create(tempLesson)
			.catch((err) => {
				throw new GeneralError('Can not create new lesson.', err);
			});

		return Promise.all([
			this.copyHomeworks(params, sourceLesson, newCourseId, newLesson),
			this.copyFilesInLesson(params, sourceLesson, newCourseId, newLesson),
		]);
	}
}

module.exports = function setup() {
	const app = this;

	const options = {
		Model: lessonModel,
		paginate: {
			default: 500,
			max: 500,
		},
		lean: true,
	};

	app.use('/lessons', service(options));
	app.use('/lessons/:lessonId/files', new LessonFilesService());
	app.use('/lessons/copy', new LessonCopyService(app));

	// Return all lesson.contets which have component = query.type And User = query.user or null
	app.use('/lessons/contents/:type/', {
		find(params) {
			return lessonModel.aggregate([
				{ $unwind: '$contents' },
				{ $match: { 'contents.component': params.query.type } },
				{ $match: { 'contents.user_id': { $in: [params.query.user, null] } } },
				{ $project: { _id: '$contents._id', content: '$contents.content' } },
			]).exec();
		},
	});

	const systemService = app.service('/lessons');
	const lessonFilesService = app.service('/lessons/:lessonId/files/');
	const lessonCopyService = app.service('/lessons/copy');

	const hooksWrapper = {
		before: hooks.before(),
		after: hooks.after,
	};

	systemService.hooks(hooksWrapper);
	lessonFilesService.hooks(hooksWrapper);
	lessonCopyService.hooks({
		before: copyHooks.before(),
	}); // no after
};
