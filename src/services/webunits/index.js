const { WebUnits } = require('./services');
const hooks = require('./hooks');

module.exports = function setup() {
	const app = this;

	const routeName = '/webUnits';
	app.use(routeName, new WebUnits());

	const webUnitsService = app.service(routeName);

	webUnitsService.before(hooks.before);
	webUnitsService.after(hooks.after);
};
