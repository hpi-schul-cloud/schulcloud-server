const setupFacadeLocator = (app) => {
	app.facadeDict = {};
	app.registerFacade = (path, facade) => {
		console.log('register facade ' + path);
		app.facadeDict[path] = facade; // todo: deal with slashes and stuff
	};
	app.facade = (path) => app.facadeDict[path]; // todo: deal with slashes and stuff
	return app;
};

const setupFacades = async (app) => {
	Object.values(app.facadeDict).forEach((facade) => facade.setup(app));
	return app;
};

module.exports = { setupFacadeLocator, setupFacades };
