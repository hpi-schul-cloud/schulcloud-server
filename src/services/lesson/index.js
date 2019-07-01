const _ = require('lodash');
const errors = require('@feathersjs/errors');
const service = require('feathers-mongoose');
const lessonModel = require('./model');
const hooks = require('./hooks/index');
const copyHooks = require('./hooks/copy');
const { FileModel } = require('../fileStorage/model');
const { homeworkModel } = require('../homework/model');

class LessonFilesService {
	/**
     * @returns all files which are included in text-components of a given lesson
     * @param lessonId
     * @param query contains shareToken
     */
	find({ lessonId, query }) {
		const { shareToken } = query;
		if (!lessonId || !shareToken) throw new errors.BadRequest('Missing parameters!');

		// first fetch lesson from given id
		return lessonModel.findOne({ _id: lessonId, shareToken }).then((lesson) => {
			if (!lesson) {
				throw new errors.NotFound('No lesson was not found for given lessonId and shareToken!');
			}
			// fetch files in the given course and check whether they are included in the lesson
			return FileModel.find({ path: { $regex: lesson.courseId } }).then(files => Promise.all((files || []).filter(f =>

			// check whether the file is included in any lesson
				_.some((lesson.contents || []), content => content.component === 'text'
                        && content.content.text
                        && _.includes(content.content.text, f.key)))));
		});
	}
}

class LessonCopyService {
	constructor(app) {
		this.app = app;
	}

	/**
     * Clones a lesson to a specified course, including files and homeworks.
     * @param data consists of lessonId and newCourseId (target, source).
     * @param params user Object and other params.
     * @returns newly created lesson.
     */
	create(data, params) {
		const { lessonId, newCourseId } = data;
		const fileChangelog = [];

		return lessonModel.findOne({ _id: lessonId }).populate('courseId')
			.then((sourceLesson) => {
				let tempLesson = JSON.parse(JSON.stringify(sourceLesson));
				tempLesson = _.omit(tempLesson, ['_id', 'shareToken', 'courseId']);
				tempLesson.courseId = newCourseId;

				return lessonModel.create(tempLesson, (err, res) => {
					if (err) {
						return err;
					}

					const topic = res;

					const homeworkPromise = homeworkModel.find({ lessonId }, (err, homeworks) => {
						if (err) { return err; }

						return Promise.all(homeworks.map(((homework) => {
							if (homework.archived.length > 0
                                || (homework.teacherId.toString() !== params.account.userId.toString()
                                && homework.private)) { return false; }

							const homeworkService = this.app.service('homework/copy');

							return homeworkService.create({
								_id: homework._id,
								courseId: newCourseId,
								lessonId: res._id,
								userId: params.account.userId.toString() === homework.teacherId.toString()
									? params.account.userId : homework.teacherId,
								newTeacherId: params.account.userId,
							});
						})));
					});

					const filePromise = FileModel.find(
						{ path: { $regex: sourceLesson.courseId._id } },
					).then(files => Promise.all((files || []).filter(
						// check whether the file is included in any lesson
						f => _.some((sourceLesson.contents || []), content => content.component === 'text'
                                && content.content.text
                                && _.includes(content.content.text, f._id)),
					))
						.then(lessonFiles => Promise.all(lessonFiles.map((f) => {
							const fileData = {
								file: f._id,
								parent: newCourseId,
							};

							const fileStorageService = this.app.service('/fileStorage/copy/');

							return fileStorageService.create(fileData, params)
								.then((newFile) => {
									fileChangelog.push({
										old: `${sourceLesson.courseId._id}/${f.name}`,
										new: `${newCourseId}/${newFile.name}`,
									});
								});
						})).then(() => Promise.all(
							topic.contents.map((content) => {
								if (content.component === 'text' && content.content.text) {
									fileChangelog.map((change) => {
										content.content.text = content.content.text.replace(
											new RegExp(change.old, 'g'),
											change.new,
										);
									});
								}
							}),
						).then(() => lessonModel.update({ _id: topic._id }, topic)))));
					return Promise.all([homeworkPromise, filePromise]);
				});
			});
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
