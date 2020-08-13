const ScopeUc = require('./scope.uc');
const disallow = require('../../../common/disallow.hook');

module.exports = function setupScopeUc(app) {
	app.use('/scopeUc', new ScopeUc());
	app.service('scopeUc').hooks(disallow);
};
