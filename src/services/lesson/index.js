const service = require('feathers-mongoose');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { BadRequest } = require('../../errors');
const { LessonModel } = require('./model');
const { courseModel } = require('../user-group/model');
const { lessonContentService, lessonContentServiceHooks } = require('./services/lessonContentService');
const hooks = require('./hooks/index');
const copyHooks = require('./hooks/copy');
const { LessonCopyService, LessonFilesService, AddMaterialService } = require('./services');
const { defaultWhitelist } = require('../../utils/whitelist');

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
		whitelist: defaultWhitelist,
	};

	app.use('/lessons/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	app.use('/lessons', service(options));
	app.use('/lessons/:lessonId/files', new LessonFilesService());
	app.use('/lessons/copy', new LessonCopyService(app));

	app.use('/lessons/:lessonId/material', new AddMaterialService());

	// Return all lesson.contets which have component = query.type And User = query.user or null
	app.use('/lessons/contents/:type/', lessonContentService);

	const systemService = app.service('/lessons');
	const lessonFilesService = app.service('/lessons/:lessonId/files/');
	const lessonCopyService = app.service('/lessons/copy');

	const hooksWrapper = {
		before: hooks.before(),
		after: hooks.after,
	};

	app.service('/lessons/contents/:type/').hooks(lessonContentServiceHooks);
	systemService.hooks(hooksWrapper);
	lessonFilesService.hooks(hooksWrapper);
	lessonCopyService.hooks({
		before: copyHooks.before(),
	}); // no after
};
