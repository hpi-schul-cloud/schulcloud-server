'use strict';

const service = require('feathers-mongoose');
const lesson = require('./model');
const hooks = require('./hooks/index');
const copyHooks = require('./hooks/copy');
const _ = require('lodash');
const errors = require('feathers-errors');
const {FileModel} = require('../fileStorage/model');

class LessonFilesService {

	/**
	 * @returns all files which are included in text-components of a given lesson
	 * @param lessonId
	 * @param query contains shareToken
	 */
	find({lessonId, query}) {
		let {shareToken} = query;
		if (!lessonId || !shareToken) throw new errors.BadRequest("Missing parameters!");

		// first fetch lesson from given id
		return lesson.findOne({_id: lessonId, shareToken: shareToken}).then(lesson => {
			if (!lesson) throw new errors.NotFound("No lesson was not found for given lessonId and shareToken!");

			// fetch files in the given course and check whether they are included in the lesson
			return FileModel.find({path: {$regex: lesson.courseId}}).then(files => {
				return Promise.all((files || []).filter(f => {

					// check whether the file is included in any lesson
					return _.some((lesson.contents || []), content => {
						return content.component === "text" && content.content.text && _.includes(content.content.text, f.key);
					});
				}));
			});
		});
	}
}

class LessonCopyService {

	constructor(app) {
		this.app = app;
	}

	/**
	 * Clones a lesson to a specified course, including files.
	 * @param data consists of lessonId and newCourseId (target, source).
	 * @param params user Object and other params.
	 * @returns newly created lesson.
	 */
	create(data, params) {
		let {lessonId, newCourseId} = data;
		let fileChangelog = [];

		return lesson.findOne({_id: lessonId}).populate('courseId')
			.then(sourceLesson => {
				let tempLesson = JSON.parse(JSON.stringify(sourceLesson));
				tempLesson = _.omit(tempLesson, ['_id', 'shareToken', 'courseId']);
				tempLesson.courseId = newCourseId;
				let originalSchoolId = sourceLesson.courseId.schoolId;

				return lesson.create(tempLesson, (err, res) => {
					if (err)
						return err;

					let topic = res;

					return FileModel.find({path: {$regex: sourceLesson.courseId._id.toString() }}).then(files => {
						return Promise.all((files || []).filter(f => {

							// check whether the file is included in any lesson
							return _.some((sourceLesson.contents || []), content => {
								return content.component === "text" && content.content.text && _.includes(content.content.text, f._id);
							});
						}))
							.then(lessonFiles => {
								return Promise.all(lessonFiles.map(f => {

									let fileData = {
										file: f._id,
										parent: newCourseId
									};

									let fileStorageService = this.app.service('/fileStorage/copy/');

									return fileStorageService.create(fileData, params)
										.then(newFile => {
											fileChangelog.push({
												"old": `${sourceLesson.courseId._id}/${f.name}`,
												"new": `${newCourseId}/${newFile.name}`
											});
										});
								}))
									.then(_ => {
										return Promise.all(
										topic.contents.map(content => {
											if (content.component === "text" && content.content.text) {
												fileChangelog.map(change => {
													content.content.text = content.content.text.replace(new RegExp(change.old, "g"), change.new);
												});
											}
										}))
											.then(_ => {
												return lesson.update({_id: topic._id}, topic);
											});
									});
							});
					});
				});
			});
	}
}

module.exports = function () {
	const app = this;

	const options = {
		Model: lesson,
		paginate: {
			default: 500,
			max: 500
		},
		lean: true
	};


	// Initialize our model service with any options it requires
	app.use('/lessons', service(options));

	app.use('/lessons/:lessonId/files', new LessonFilesService());

	app.use('/lessons/copy', new LessonCopyService(app));


	// Return all lesson.contets which have component = query.type And User = query.user or null
	app.use('/lessons/contents/:type/', {
		find(params) {
			return lesson.aggregate([
				{$unwind: '$contents'},
				{$match: {"contents.component": params.query.type}},
				{$match: {"contents.user_id": {$in: [params.query.user, null]}}},
				{$project: {_id: "$contents._id", content: "$contents.content"}}
			]).exec();
		}
	});

	// Get our initialize service to that we can bind hooks
	const systemService = app.service('/lessons');
	const lessonFilesService = app.service('/lessons/:lessonId/files/');
	const lessonCopyService = app.service('/lessons/copy');

	// Set up our before hooks
	systemService.before(hooks.before);
	lessonFilesService.before(hooks.before);
	lessonCopyService.before(copyHooks.before);

	// Set up our after hooks
	systemService.after(hooks.after);
	lessonFilesService.after(hooks.after);
};
