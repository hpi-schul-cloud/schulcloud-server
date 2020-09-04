const NewsUc = require('./news.uc');
const disallow = require('../../../common/disallow.hook');
const NewsBcFacade = require('./news.facade');

module.exports = function setUpNewsUCs(app) {
	/* app.use('/newsBcFacade', new NewsBcFacade());
	app.service('newsBcFacade').hooks(disallow); */

	app.use('/newsUc', new NewsUc());
	app.service('newsUc').hooks(disallow);
};
