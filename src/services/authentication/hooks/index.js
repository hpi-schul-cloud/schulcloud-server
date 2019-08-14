const auth = require('@feathersjs/authentication');

const injectUserId = (hook) => {
	const { accountId } = hook.params.payload;
	return hook.app.service('/accounts').get(accountId).then((account) => {
		if (account.userId) {
			hook.params.payload.userId = account.userId;
		}
		if (account.systemId) {
			hook.params.payload.systemId = account.systemId;
		}
		return hook;
	});
};

const lowerCaseUsername = (hook) => {
	if (hook.data.username) {
		hook.data.username = hook.data.username.toLowerCase();
	}
	return hook;
};

const populateResult = (hook) => {
	hook.result.userId = hook.params.account.userId; // required by event listeners
	return hook;
};

/*
const isActivated = (account) => {
	todo account activated = true should test it | injectUserId pass the account informations
	return account
}
*/
exports.before = {
	create: [
		lowerCaseUsername,
		auth.hooks.authenticate(['local', 'jwt', 'ldap', 'iserv', 'moodle']),
		injectUserId,
		// isActivated,
	],
	remove: [
		auth.hooks.authenticate('jwt'),
	],
};

exports.after = {
	create: [],
	remove: [populateResult],
};
