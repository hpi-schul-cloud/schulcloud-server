const { BadRequest, Forbidden } = require('@feathersjs/errors');
const constants = require('../../../utils/constants');
const { blockDisposableEmail } = require('../../../hooks');
const { trimPassword } = require('../../account/hooks');
const { checkUniqueAccount } = require('../../user/hooks/userService');
const { hasPermission } = require('../../../hooks');

const nullOrEmpty = (string) => !string;

const login = async (app, username, password, strategy) => app.service('authentication')
	.create({
		strategy: strategy || 'local',
		username,
		password,
	})
	.then((result) => result.accessToken)
	.catch(() => null);

const isValidLogin = (jwt) => !!jwt;

const validPassword = async (hook) => {
	if (!hook.data || !hook.data.password) throw new BadRequest('Missing information');
	const { password } = hook.data;
	const { username } = hook.params.account;

	const jwt = await login(hook.app, username, password);
	if (!isValidLogin(jwt)) {
		throw new Forbidden('Not authorized');
	}
	return hook;
};

const blockThirdParty = (hook) => {
	if (hook.params.account.systemId) {
		throw new Forbidden('Your user data is managed by a IDM. Changes to it can only be made in the source system');
	}
	return hook;
};

const validateEmail = (hook) => {
	if (nullOrEmpty(hook.data.email)) {
		throw new BadRequest('email missing');
	}
	if (nullOrEmpty(hook.data.repeatEmail)) {
		throw new BadRequest('email repeat missing');
	}
	if (hook.data.email === hook.params.account.username) {
		throw new BadRequest('Your new email is the same as your current one');
	}
	if (!constants.expressions.email.test(hook.data.email)) {
		throw new BadRequest('Please enter a valid e-mail address');
	}
	if (hook.data.email !== hook.data.repeatEmail) {
		throw new BadRequest('email and email repeat do not match');
	}
	return hook;
};

module.exports = {
	validPassword,
	blockThirdParty,
	validateEmail,
	checkUniqueAccount,
	blockDisposableEmail,
	trimPassword,
	hasPermission,
};
