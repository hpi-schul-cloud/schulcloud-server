const { stripSlashes } = require('@feathersjs/commons');

const registerInternalService = (app, path, service) => {
	const servicePath = stripSlashes(path);
	app.use(servicePath, service, { methods: [] });
	if (app.routes) {
		app.routes.remove(servicePath);
		app.routes.remove(`${servicePath}/:__id`);
	}
	return app.service(servicePath);
};

module.exports = registerInternalService;