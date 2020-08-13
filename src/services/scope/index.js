const setupScopeUc = require('./uc');

module.exports = function scope() {
	const app = this;
	setupScopeUc(app);
};
