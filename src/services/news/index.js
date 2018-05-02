'use strict';

const service = require('feathers-mongoose');
const {newsModel, newsHistoryModel} = require('./model');
const hooks = require('./hooks');
const swaggerDocs = require ('./docs/');

module.exports = function() {
	const app = this;

	var newsServiceApp = service({
		Model: newsModel,
		paginate: {
			default: 25,
			max: 100
		}
	});
	newsServiceApp.docs = swaggerDocs.newsService;

	app.use('/news', newsServiceApp);

	const NewsService = app.service('/news');
	NewsService.before(hooks.before);
	NewsService.after(hooks.after);

	var newsHistoryServiceApp = service({
		Model: newsHistoryModel
	});
	newsHistoryServiceApp.docs = swaggerDocs.newsHistoryService;
    
    app.use('/newshistory', newsHistoryServiceApp);
	const NewsHistoryService = app.service('/newshistory');
	NewsHistoryService.before(hooks.before);
	NewsHistoryService.after(hooks.after);
};
