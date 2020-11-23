function stripSlashes(path) {
	return path.replace(/^(\/+)|(\/+)$/g, '');
}

const setupFacadeLocator = (app) => {
	app.set('facadeDict', {});
	app.registerFacade = (path, facade) => {
		const strippedPath = stripSlashes(path);
		app.get('facadeDict')[strippedPath] = facade;
	};
	app.facade = (path) => {
		const strippedPath = stripSlashes(path);
		return app.get('facadeDict')[strippedPath];
	};
	return app;
};

const setupFacades = async (app) => {
	Object.values(app.get('facadeDict')).forEach((facade) => facade.setup(app));
	return app;
};

module.exports = { setupFacadeLocator, setupFacades };
