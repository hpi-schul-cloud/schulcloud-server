const disallow = require('../../common/disallow.hook');

// For inter-component calls
class NewsBcFacade {
	setup(app) {
		// asdas
	}
}

module.exports = function setupNewsFacade(app) {
	app.use('/newsBcFacade', new NewsBcFacade());
	app.service('newsBcFacade').hooks(disallow);
};
