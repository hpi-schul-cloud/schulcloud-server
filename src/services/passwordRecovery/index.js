const service = require('feathers-mongoose');
const passwordRecovery = require('./model');
const hooks = require('./hooks');
const AccountModel = require('../account/model');

class ChangePasswordService {
	create(data) {
		return passwordRecovery.findOne({ _id: data.resetId, changed: false })
			.then((pwrecover) => AccountModel.update({ _id: pwrecover.account }, { password: data.password })
				.then((account) => passwordRecovery.update({ _id: data.resetId }, { changed: true })
					.then(((_) => account)))).catch((error) => error);
	}
}

module.exports = function () {
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
