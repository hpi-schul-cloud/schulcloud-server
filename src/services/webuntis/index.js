const { WebUntis } = require('./services');
const hooks = require('./hooks');

module.exports = function setup() {
	const app = this;

	const routeName = '/webUntis';
	app.use(routeName, new WebUntis());

	const webUntisService = app.service(routeName);

	webUntisService.before(hooks.before);
	webUntisService.after(hooks.after);
};
