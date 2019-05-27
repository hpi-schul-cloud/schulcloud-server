const auth = require('@feathersjs/authentication');
const logger = require('winston');
const { BadRequest } = require('@feathersjs/errors');
const globalHooks = require('../../../hooks');
const { newsModel, newsHistoryModel } = require('../model');

const restrictToCurrentSchool = globalHooks.ifNotLocal(globalHooks.restrictToCurrentSchool);

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

exports.before = {
	all: [
		auth.hooks.authenticate('jwt'),
		lookupSchool,
	],
	find: [],
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
