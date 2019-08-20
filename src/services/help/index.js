const auth = require('@feathersjs/authentication');
const hooks = require('feathers-hooks-common');
const errors = require('@feathersjs/errors');
const { helpDocumentsModel } = require('./model');

class HelpDocumentsService {
	async find(params) {
		const promises = [helpDocumentsModel.find({ theme: params.query.theme })];
		if (params.account) {
			const school = await this.app.service('users').get(params.account.userId)
				.then(user => this.app.service('schools').get(user.schoolId));
			promises.push(helpDocumentsModel.find({ schoolId: school._id }));
		}
		const [themeResult, schoolResult] = await Promise.all(promises);
		let result;
		if (schoolResult && schoolResult.length > 0) {
			result = schoolResult[0].data;
		} else if (themeResult && themeResult.length > 0) {
			result = themeResult[0].data;
		} else {
			return Promise.reject(new errors.NotFound('could not find help documents for this user or theme.'));
		}
		return result;
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
