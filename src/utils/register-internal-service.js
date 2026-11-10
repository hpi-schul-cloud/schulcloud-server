const { stripSlashes } = require('@feathersjs/commons');

const registerInternalService = (app, path, service) => {
	const servicePath = stripSlashes(path);
	app.use(servicePath, service, { methods: [] });
	// feathers' Router.remove deletes the whole placeholder node for parameterized paths (e.g. ':scopeId'),
	// including sibling routes, and then throws on the second remove. Such services expose no methods anyway.
	if (app.routes && !servicePath.includes(':')) {
		app.routes.remove(servicePath);
		app.routes.remove(`${servicePath}/:__id`);
	}
	return app.service(servicePath);
};

module.exports = registerInternalService;