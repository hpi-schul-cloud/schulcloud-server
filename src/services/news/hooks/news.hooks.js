const { BadRequest } = require('@feathersjs/errors');
const { newsHistoryModel } = require('../model');

const deleteNewsHistory = async (context) => {
	if (context.id) {
		await newsHistoryModel.remove({ parentId: context.id });
	}
};

/**
 * Decorates context.params.account with the user's schoolId
 * @param {context} context Hook context
 * @requires auth.hooks.authenticate('jwt')
 * @throws {BadRequest} if not authenticated or userId is missing.
 * @throws {NotFound} if user cannot be found
 */
const lookupSchool = async (context) => {
	if (context.params.account && context.params.account.userId) {
		const { schoolId } = await context.app.service('users').get(context.params.account.userId);
		context.params.account.schoolId = schoolId;
		return context;
	}
	throw new BadRequest('Authentication is required.');
};

const getBoolean = value => value === true || value === 'true';

/**
 * Convert pagination parameter to boolean if it exists
 * @param {context} context
 */
const preparePagination = (context) => {
	if (context.params) {
		const { query } = context.params;
		if (query && query.$paginate !== undefined) {
			context.params.query.$paginate = getBoolean(query.$paginate);
		}
	}
	return context;
};

module.exports = {
	deleteNewsHistory,
	lookupSchool,
	preparePagination,
};
