const { checkPasswordStrength, passwordsMatch } = require('../../helper/passwordHelpers');
const { BadRequest } = require('@feathersjs/errors');


const setupNewPasswordProvidedByUser = async (data, params, app) => {
	const newPassword = data['password-1'];
	if (!passwordsMatch(newPassword, data['password-2'])) {
		return Promise.reject(new BadRequest('Die neuen Passwörter stimmen nicht überein.'));
	}
	if (!checkPasswordStrength(newPassword)) {
		throw new BadRequest('Dein Passwort stimmt mit dem Pattern nicht überein.');
	}

	const { accountId } = params.authentication.payload;
	const accountUpdate = {
		password_verification: data.password_verification || data['password-2'],
		password: newPassword,
		forceChangePassword: false,
	};

	const accountPromise = app.service('accounts')
		.patch(accountId, accountUpdate, params);
	return accountPromise
		.then((result) => Promise.resolve(result))
		.catch((err) => Promise.reject(err));
};

module.exports = function setup(app) {
	class ForceChangePasswordService {
		create(data, params) {
			return setupNewPasswordProvidedByUser(data, params, app);
		}
	}
	return ForceChangePasswordService;
};
