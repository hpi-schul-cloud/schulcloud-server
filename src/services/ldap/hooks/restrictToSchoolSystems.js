const reqlib = require('app-root-path').require;

const { Forbidden, BadRequest } = reqlib('src/errors');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;

/**
 * Restricts access to systems used by the school of the caller.
 * Requires populateCurrentSchool and authentication before use!
 * Cannot be used for internal calls.
 * @param {Context} context Feathers hook context
 */
const restrictToSchoolSystems = (context) => {
	if (!context.id || !context.params || !context.params.school) {
		throw new BadRequest('Unexpected call to restrictToValidSystems.');
	}
	const systemIds = context.params.school.systems || [];
	if (systemIds.some((systemId) => equalIds(systemId, context.id))) {
		return context;
	}
	throw new Forbidden("You're not authorized to access this system.");
};

module.exports = restrictToSchoolSystems;
