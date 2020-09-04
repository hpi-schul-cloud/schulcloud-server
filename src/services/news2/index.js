const setupNewsRepo = require('./repo');
const setupNewsUc = require('./uc');
const setupNewsSerivce = require('./service');
const setupNewsFacade = require('./uc/news.facade');

module.exports = function news2() {
	const app = this;

	setupNewsRepo(app);
	setupNewsUc(app);
	// setupNewsFacade(app);
	setupNewsSerivce(app);
};
