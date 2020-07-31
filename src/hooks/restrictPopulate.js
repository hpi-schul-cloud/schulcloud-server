const { BadRequest } = require('@feathersjs/errors');

const errorMessage = 'populate not supported';

const populateSelectHelper = (input, whitelist) => {
	const path = (typeof input === 'string') ? input : input.path;
	if (!whitelist[path]) throw new BadRequest(errorMessage);
	return { path, select: whitelist[path] };
};

/* const whitelist = {
	classIds: ['_id', 'displayName'],
	userIds: ['_id', 'firstName', 'lastName', 'fullName', 'schoolId'],
	teacherIds: ['_id', 'firstName', 'lastName'],
}; */

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

module.exports = {
	getRestrictPopulatesHook,
	populateSelectHelper,
	errorMessage,
};
