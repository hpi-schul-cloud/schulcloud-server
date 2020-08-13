const NewsUc = require('./news.uc');
const disallow = require('../../../common/disallow.hook');

module.exports = function setUpNewsUCs(app) {
	app.use('/newsUc', new NewsUc());
	app.service('newsUc').hooks(disallow);
};
