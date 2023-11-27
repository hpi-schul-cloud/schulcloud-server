const service = require('feathers-mongoose');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { LessonModel } = require('./model');
const { lessonContentService, lessonContentServiceHooks } = require('./services/lessonContentService');
const hooks = require('./hooks/index');
const { AddMaterialService } = require('./services');

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

	app.use('/lessons/:lessonId/material', new AddMaterialService());

	// Return all lesson.contets which have component = query.type And User = query.user or null
	app.use('/lessons/contents/:type/', lessonContentService);

	const systemService = app.service('/lessons');

	const hooksWrapper = {
		before: hooks.before(),
		after: hooks.after,
	};

	app.service('/lessons/contents/:type/').hooks(lessonContentServiceHooks);
	systemService.hooks(hooksWrapper);
};
