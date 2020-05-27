const { BadRequest, Forbidden } = require('@feathersjs/errors');
const constants = require('../../../utils/constants');
const { blockDisposableEmail } = require('../../../hooks');
const {
	trimPassword,
} = require('../../account/hooks');
const { hasPermission } = require('../../../hooks');

const validPassword = (hook) => {
	if (!hook.data || !hook.data.password) throw new BadRequest('Missing information');
	const { password } = hook.data;
	const { username } = hook.params.account;

	return new Promise((resolve, reject) => {
		hook.app.service('authentication')
			.create({
				strategy: 'local',
				username,
				password,
			})
			.then((result) => {
				resolve(hook);
			})
			.catch(() => {
				reject(new Forbidden('Not authorized'));
			});
	});
};

const blockThirdParty = (hook) => {
	if (hook.params.account.system) {
		throw new Forbidden('Your user data is managed by a IDM. Changes to it can only be made in the source system');
	}
	return hook;
};

const sanitizeData = (hook) => {
	if ('email' in hook.data) {
		if (hook.data.email === hook.params.account.username) {
			throw new BadRequest('Your new email is the same as your current one');
		}
		if (!constants.expressions.email.test(hook.data.email)) {
			throw new BadRequest('Please enter a valid e-mail address!');
		}
	}
	return hook;
};

module.exports = {
	validPassword,
	blockThirdParty,
	sanitizeData,
	blockDisposableEmail,
	trimPassword,
	hasPermission,
};
