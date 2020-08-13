const NewsUc = require('./news.uc');
const disallow = require('../../../common/disallow.hook');

const NEWS_UC_NAME = 'newsUc';
module.exports = function setUpNewsUCs(app) {
	app.use(NEWS_UC_NAME, new NewsUc());
	app.service(NEWS_UC_NAME).hooks(disallow);
};
