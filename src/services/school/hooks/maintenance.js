const auth = require('@feathersjs/authentication');
const { BadRequest } = require('@feathersjs/errors');
const hooks = require('feathers-hooks-common');
const globalHooks = require('../../../hooks');
const { schoolModel: School } = require('../model');

const lookupSchool = async (context) => {
	if (!context.params || !context.params.route) {
		throw new BadRequest('Missing request params');
	}
	const { schoolId } = context.params.route;
	context.params.school = await School
		.findById(schoolId)
		.select(['name', 'currentYear', 'inMaintenanceSince', 'inMaintenance'])
		.populate(['currentYear', 'systems'])
		.lean({ virtuals: true })
		.exec();
	return context;
};

module.exports = {
	before: {
		all: [
			globalHooks.ifNotLocal(auth.hooks.authenticate('jwt')),
			globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool),
			lookupSchool,
		],
		find: [],
		create: [
			globalHooks.ifNotLocal(globalHooks.hasPermission('SCHOOL_EDIT')),
		],
		update: [hooks.disable()],
		get: [hooks.disallow()],
		patch: [hooks.disallow()],
		remove: [hooks.disallow()],
	},
};
