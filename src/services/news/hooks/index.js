const auth = require('@feathersjs/authentication');
const logger = require('winston');
const { BadRequest } = require('@feathersjs/errors');
const { newsModel, newsHistoryModel } = require('../model');

const deleteNewsHistory = (hook) => {
	newsModel.findOne({ _id: hook.id })
		.then((news) => {
			for (let i = 0; i < news.history.length; i += 1) {
				newsHistoryModel.findOneAndRemove({ _id: news.history[i] })
					.catch(err => logger.log('error', err));
			}
		});
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

const getBoolean = (value) => {
	switch (value) {
		case true:
		case 'true':
		case 1:
		case '1':
		case 'on':
		case 'yes':
			return true;
		default:
			return false;
	}
};

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

exports.before = {
	all: [
		auth.hooks.authenticate('jwt'),
		lookupSchool,
	],
	find: [
		preparePagination,
	],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [],
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: [
		deleteNewsHistory,
	],
};
