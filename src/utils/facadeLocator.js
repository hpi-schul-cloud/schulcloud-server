function stripSlashes(path) {
	return path.replace(/^(\/+)|(\/+)$/g, '');
}

const setupFacadeLocator = (app) => {
	app.facadeDict = {};
	app.registerFacade = (path, facade) => {
		const strippedPath = stripSlashes(path);
		app.facadeDict[strippedPath] = facade;
	};
	app.facade = (path) => {
		const strippedPath = stripSlashes(path);
		return app.facadeDict[strippedPath];
	};
	return app;
};

const setupFacades = async (app) => {
	Object.values(app.facadeDict).forEach((facade) => facade.setup(app));
	return app;
};

module.exports = { setupFacadeLocator, setupFacades };
