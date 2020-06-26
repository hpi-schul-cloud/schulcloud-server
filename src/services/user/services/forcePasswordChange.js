const { BadRequest } = require('@feathersjs/errors');
const { passwordsMatch } = require('../../../helper/passwordHelpers');

const setupNewPasswordProvidedByUser = (app) => async (data, params) => {
	const newPassword = data['password-1'];
	if (!passwordsMatch(newPassword, data['password-2'])) {
		return Promise.reject(new BadRequest('Die neuen Passwörter stimmen nicht überein.'));
	}

	const { accountId } = params.authentication.payload;
	const accountUpdate = {
		password: newPassword,
		userForcedToChangePassword: true,
		forcePasswordChange: false,
	};

	const accountPromise = app.service('accounts')
		.patch(accountId, accountUpdate, params);
	return accountPromise
		.then((result) => Promise.resolve(result))
		.catch((err) => Promise.reject(err));
};

module.exports = function setup(app) {
	const setupNewPassword = setupNewPasswordProvidedByUser(app);
	class ForcePasswordChangeService {
		create(data, params) {
			return setupNewPassword(data, params);
		}
	}
	return ForcePasswordChangeService;
};
