const auth = require('@feathersjs/authentication');
const hooks = require('feathers-hooks-common');
const { helpDocumentsModel } = require('./model');

class HelpDocumentsService {
	async find(params) {
		const themeResult = await helpDocumentsModel.find({ theme: params.query.theme });
		const school = await this.app.service('users').get(params.account.userId)
			.then(user => this.app.service('schools').get(user.schoolId));
		const schoolResult = await helpDocumentsModel.find({ schoolId: school._id });
		let result;
		if (themeResult.length > 0) {
			result = themeResult[0].data;
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
