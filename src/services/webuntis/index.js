const { WebUntis } = require('./services');
const hooks = require('./hooks');

module.exports = function setup() {
	const app = this;

	const routeName = '/webUntis';
	app.use(routeName, new WebUntis());

	const webUnitsService = app.service(routeName);

	webUnitsService.before(hooks.before);
	webUnitsService.after(hooks.after);
};
