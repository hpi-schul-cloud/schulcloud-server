/**
 * This service is reduced to the model service for legacy reasons only:
 * When a team is deleted, through events, the related news will be removed
 * The public API has been moved to apps/server/src/modules/news
 */

const service = require('feathers-mongoose');

const { newsModel } = require('./model');
const newsModelHooks = require('./hooks/newsModel.hooks');

const DEFAULT_PAGINATION_OPTIONS = {
	default: 25,
};

module.exports = function news() {
	const app = this;

	// use /newsModel to directly access the model from other services
	// (external requests are blocked)
	app.use(
		'/newsModel',
		service({
			Model: newsModel,
			lean: true,
			paginate: DEFAULT_PAGINATION_OPTIONS,
		})
	);
	app.service('/newsModel').hooks(newsModelHooks);
};
