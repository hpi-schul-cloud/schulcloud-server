const NewsRepo = require('./news.repo');
const disallow = require('../../../common/disallow.hook');

const NEWS_REPO = 'newsRepo';

module.exports = function setUpNewsRepos(app) {
	app.use(NEWS_REPO, new NewsRepo());
	app.service(NEWS_REPO).hooks(disallow);
};
