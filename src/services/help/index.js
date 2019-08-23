const auth = require('@feathersjs/authentication');
const hooks = require('feathers-hooks-common');
const errors = require('@feathersjs/errors');
const { helpDocumentsModel } = require('./model');
const logger = require('../../logger');

const findDocuments = async (app, params) => {
	if (!(params.query || {}).theme) {
		throw new errors.BadRequest('this method requires querying for a theme - query:{theme:"themename"}');
	}

	let query = { theme: params.query.theme };
	if (params.account) {
		const school = await app.service('users').get(params.account.userId)
			.then(user => app.service('schools').get(user.schoolId));

		if (school.documentBaseDirType === 'school') query = { schoolId: school._id };
		if (school.documentBaseDirType === 'schoolGroup') query = { schoolGroupId: school.schoolGroup };
	}
	const result = await helpDocumentsModel.find(query);

	if (result.length < 1) throw new errors.NotFound('could not find help documents for this user or theme.');
	return result[0].data;
};

class HelpDocumentsService {
	async find(params) {
		try {
			return findDocuments(this.app, params);
		} catch (err) {
			logger.log('warn', err);
			throw err;
		}
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = function news() {
	const app = this;

	app.use('/help/documents', new HelpDocumentsService());
	const service = app.service('/help/documents');

	service.hooks({
		before: {
			all: [auth.hooks.authenticate('jwt')],
			find: [],
			get: [hooks.disallow()],
			create: [hooks.disallow()],
			update: [hooks.disallow()],
			patch: [hooks.disallow()],
			remove: [hooks.disallow()],
		},
	});
};
