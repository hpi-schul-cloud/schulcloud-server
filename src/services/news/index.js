'use strict';

const service = require('feathers-mongoose');
const newsModel = require('./model');
const hooks = require('./hooks');

module.exports = function() {
	const app = this;

	app.use('/news', service({
		Model: newsModel,
		paginate: {
			default: 25,
			max: 100
		}
	}));
	const NewsService = app.service('/news');
	NewsService.before(hooks.before);
	NewsService.after(hooks.after);
};
