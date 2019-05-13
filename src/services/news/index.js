const service = require('feathers-mongoose');
const { newsModel, newsHistoryModel } = require('./model');
const hooks = require('./hooks');

module.exports = function news() {
	const app = this;

	app.use('/news', service({
		Model: newsModel,
		paginate: {
			default: 25,
			max: 100,
		},
	}));
	const NewsService = app.service('/news');
	NewsService.hooks(hooks);

	app.use('/newshistory', service({
		Model: newsHistoryModel,
	}));
	const NewsHistoryService = app.service('/newshistory');
	NewsHistoryService.hooks(hooks);
};
