const ScopeBcFacade = require('./scope.facade');

module.exports = function setupScopeUc(app) {
	app.registerFacade('scope', new ScopeBcFacade());
};
