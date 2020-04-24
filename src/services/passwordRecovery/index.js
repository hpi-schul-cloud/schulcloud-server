const service = require('feathers-mongoose');
const passwordRecovery = require('./model');
const hooks = require('./hooks');
const logger = require('../../logger/index');
const AccountModel = require('../account/model');

class ChangePasswordService {
	async create(data) {
		try {
			const pwrecover = await passwordRecovery.findOne({ _id: data.resetId, changed: false });
			if (Date.now() - Date.parse(pwrecover.createdAt) >= 86400000) {
				return Promise.resolve();
			}
			await AccountModel.update({ _id: pwrecover.account }, { password: data.password });
			await passwordRecovery.update({ _id: data.resetId }, { changed: true });
		} catch (err) {
			logger.error(err);
		}
		return Promise.resolve();
	}
}

module.exports = function setup() {
	const app = this;

	const options = {
		Model: passwordRecovery,
		paginate: {
			default: 100,
			max: 100,
		},
		lean: true,
	};

	app.use('/passwordRecovery', service(options));
	app.use('/passwordRecovery/reset', new ChangePasswordService());
	const passwordRecoveryService = app.service('/passwordRecovery');
	const changePasswordService = app.service('/passwordRecovery/reset');

	passwordRecoveryService.hooks(hooks);
	changePasswordService.hooks(hooks);
};
