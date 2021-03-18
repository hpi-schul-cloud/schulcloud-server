const service = require('feathers-mongoose');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { LessonModel } = require('./model');
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
		multi: true,
	};

	app.use('/lessons/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	app.use('/lessons', service(options));
	app.use('/lessons/:lessonId/files', new LessonFilesService());
	app.use('/lessons/copy', new LessonCopyService(app));

	app.use('/lessons/:lessonId/material', new AddMaterialService());

	// Return all lesson.contets which have component = query.type And User = query.user or null
	app.use('/lessons/contents/:type/', {
		find(params) {
			return LessonModel.aggregate([
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
