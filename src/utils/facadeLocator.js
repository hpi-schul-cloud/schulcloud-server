function stripSlashes(path) {
	return path.replace(/^(\/+)|(\/+)$/g, '');
}
const facadeDict = {};

const facadeLocator = {
	facade: (path) => {
		const strippedPath = stripSlashes(path);
		return facadeDict[strippedPath];
	},
	registerFacade: (path, facade) => {
		const strippedPath = stripSlashes(path);
		facadeDict[strippedPath] = facade;
	},
};

const setupFacadeLocator = (app) => {
	app.registerFacade = (path, facade) => {
		return facadeLocator.registerFacade(path, facade);
	};
	app.facade = (path) => {
		return facadeLocator.facade(path);
	};
	return app;
};

module.exports = { setupFacadeLocator, facadeLocator };
