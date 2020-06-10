const { authenticate } = require('@feathersjs/authentication');
const hooks = require('feathers-hooks-common');
const errors = require('@feathersjs/errors');
const { helpDocumentsModel } = require('./model');
const logger = require('../../logger');
const { excludeAttributesFromSanitization } = require('../../hooks/sanitizationExceptions');

/**
 * retrieve documents from database according to theme and userId
 */
const findDocuments = async (app, userId, theme) => {
	let query = { theme };
	if (userId) {
		const school = await app.service('users').get(userId)
			.then((user) => app.service('schools').get(user.schoolId));

		if (school.documentBaseDirType === 'school') query = { schoolId: school._id };
		if (school.documentBaseDirType === 'schoolGroup') query = { schoolGroupId: school.schoolGroupId };
	}
	const result = await helpDocumentsModel.find(query).lean().exec();

	if (result.length < 1) throw new errors.NotFound('could not find help documents for this user or theme.');
	return result[0].data;
};


/**
 * Service to get an array of help Document data, specific to school, schoolgroup, or theme.
 */
class HelpDocumentsService {
	/**
	 * find the correct help document data for the user.
	 * @param {Object} params has to include a query object with a theme.
	 * May also include a userId for internal calls.
	 */
	async find(params) {
		try {
			if (!(params.query || {}).theme) {
				throw new errors.BadRequest('this method requires querying for a theme - query:{theme:"themename"}');
			}
			const { userId } = params.account || params.query || {};
			const { theme } = params.query || {};
			return findDocuments(this.app, userId, theme);
		} catch (err) {
			logger.warning(err);
			throw err;
		}
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = function news() {
	const app = this;
	const path = 'help/documents';
	app.use(path, new HelpDocumentsService());
	const service = app.service(path);

	service.hooks({
		before: {
			all: [authenticate('jwt')],
			find: [excludeAttributesFromSanitization(path, ['title', 'content'])],
			get: [hooks.disallow()],
			create: [hooks.disallow()],
			update: [hooks.disallow()],
			patch: [hooks.disallow()],
			remove: [hooks.disallow()],
		},
	});
};
