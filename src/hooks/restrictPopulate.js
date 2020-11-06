const reqlib = require('app-root-path').require;

const { BadRequest } = reqlib('src/errors');

const errorMessage = 'populate not supported';

const populateSelectHelper = (input, whitelist) => {
	const path = typeof input === 'string' ? input : input.path;
	if (!whitelist[path]) throw new BadRequest(errorMessage);
	return { path, select: whitelist[path] };
};

const getRestrictPopulatesHook = (whitelist) => (context) => {
	if (((context.params || {}).query || {}).$populate) {
		let populate = context.params.query.$populate;
		if (Array.isArray(populate)) {
			populate = populate.map((o) => populateSelectHelper(o, whitelist));
		} else {
			populate = populateSelectHelper(populate, whitelist);
		}
		context.params.query.$populate = populate;
	}
	return context;
};

const preventPopulate = (context) => {
	if (((context.params || {}).query || {}).$populate) {
		throw new BadRequest(errorMessage);
	}
	return context;
};

module.exports = {
	getRestrictPopulatesHook,
	preventPopulate,
	populateSelectHelper,
	errorMessage,
};
