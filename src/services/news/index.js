const service = require('feathers-mongoose');
const { newsModel, newsHistoryModel } = require('./model');
const hooks = require('./hooks');
const events = require('./events');

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
	NewsService.before(hooks.before);
	NewsService.after(hooks.after);

	app.use('/newshistory', service({
		Model: newsHistoryModel,
	}));
	const NewsHistoryService = app.service('/newshistory');
	NewsHistoryService.before(hooks.before);
	NewsHistoryService.after(hooks.after);

	events.configure(app);
};
