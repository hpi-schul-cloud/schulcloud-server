const NewsRestService = require('./news.service');
const newsHooks = require('./news.service.hooks');

module.exports = function setUpNewsServices(app) {
	app.use('/news2', new NewsRestService());
	app.service('news2').hooks(newsHooks);
};
