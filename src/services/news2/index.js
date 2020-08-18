const setupNewsService = require('./service');
const setupNewsFacade = require('./news.facade');

module.exports = (app) => {
	setupNewsFacade(app);
	setupNewsService(app);
};
