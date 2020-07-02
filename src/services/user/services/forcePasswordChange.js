const { BadRequest } = require('@feathersjs/errors');
const { passwordsMatch } = require('../../../utils/passwordHelpers');

class ForcePasswordChangeService {
	constructor(options) {
		this.options = options || {};
	}

	async setupNewPasswordProvidedByUser(data, params) {
		const newPassword = data['password-1'];
		if (!passwordsMatch(newPassword, data['password-2'])) {
			return Promise.reject(new BadRequest('Die neuen Passwörter stimmen nicht überein.'));
		}

		const { accountId } = params.authentication.payload;
		const accountUpdate = {
			password: newPassword,
			userForcedToChangePassword: true,
		};

		const accountPromise = this.app.service('/accounts')
			.patch(accountId, accountUpdate, params);
		await accountPromise
			.then((result) => Promise.resolve(result))
			.catch((err) => Promise.reject(err));

		const userPromise = this.app.service('/users')
			.patch(params.account.userId, { forcePasswordChange: false });
		return userPromise
			.then((result) => Promise.resolve(result))
			.catch((err) => Promise.reject(err));
	}

	create(data, params) {
		return this.setupNewPasswordProvidedByUser(data, params);
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = ForcePasswordChangeService;
