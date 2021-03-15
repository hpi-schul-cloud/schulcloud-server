const service = require('feathers-mongoose');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { BadRequest } = require('../../errors');
const { LessonModel } = require('./model');
const { courseModel } = require('../user-group/model');
const hooks = require('./hooks/index');
const copyHooks = require('./hooks/copy');
const { LessonCopyService, LessonFilesService, AddMaterialService } = require('./services');

module.exports = function setup() {
	const app = this;

	const options = {
		Model: LessonModel,
		paginate: {
			default: 500,
			max: 500,
		},
		lean: true,
	};

	app.use('/lessons/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	app.use('/lessons', service(options));
	app.use('/lessons/:lessonId/files', new LessonFilesService());
	app.use('/lessons/copy', new LessonCopyService(app));

	app.use('/lessons/:lessonId/material', new AddMaterialService());

	// Return all lesson.contets which have component = query.type And User = query.user or null
	app.use('/lessons/contents/:type/', {
		find(params) {
			const userId = params.query.user;
			if (!userId) {
				throw new BadRequest('requires a user in the query')
			}
			return LessonModel.aggregate([
				{ $lookup: {
					from: 'courses',
					localField: 'courseId',
					foreignField: '_id',
					as: 'course'
				}},
				{ $match: { $or: [
					{ 'course.userIds': userId},
					{ 'course.teacherIds': userId },
					{ 'course.substitutionIds': userId }
				]} },
				{ $unwind: '$contents' },
				{ $match: { 'contents.component': params.query.type } },
				{ $match: { $or: [
					{ 'contents.user': { $in: [params.query.user] } },
					{ $or: [
						{'contents.hidden': { $exists: false } },
						{'contents.hidden': false }
					]},
				] } },
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
