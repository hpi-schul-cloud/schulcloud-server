const NewsRestService = require('./news.service');

const NEWS_SERVICE_NAME = '/news2';
module.exports = function setUpNewsServices(app) {
	app.use(NEWS_SERVICE_NAME, new NewsRestService());
};
