const ScopeUc = require('./scope.uc');
const disallow = require('../../../common/disallow.hook');

const SCOPE_UC_NAME = 'scopeUC';
module.exports = function setupScopeUc(app) {
	app.use(SCOPE_UC_NAME, new ScopeUc());
	app.service(SCOPE_UC_NAME).hooks(disallow);
};
