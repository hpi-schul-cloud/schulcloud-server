const service = require('feathers-mongoose');
const NewsRepo = require('./news.repo');
const { newsModel } = require('./db/news.schema');
const disallow = require('../../../common/disallow.hook');

const DEFAULT_PAGINATION_OPTIONS = {
	default: 25,
};

module.exports = function setUpNewsRepos(app) {
	const repo = new NewsRepo();
	app.use('/newsRepo', repo);
	app.service('newsRepo').hooks(disallow);

	app.use('/newsModelService', service({
		Model: newsModel,
		lean: true,
		paginate: DEFAULT_PAGINATION_OPTIONS,
	}));
	app.service('newsModelService').hooks(disallow);
};
