const { authenticate } = require('@feathersjs/authentication');

const injectUserId = (context) => {
	const { systemId, username } = context.data;
	return context.app.service('/accounts').find({
		query: {
			username,
			systemId,
		},
		paginate: false,
	}).then(([account]) => {
		if (account) {
			context.params.payload = {};
			if (account.userId) {
				context.params.payload.userId = account.userId;
			}
			if (account.systemId) {
				context.params.payload.systemId = account.systemId;
			}
		}
		return context;
	});
};

const lowerCaseUsername = (hook) => {
	if (hook.data.username) {
		hook.data.username = hook.data.username.toLowerCase();
	}
	return hook;
};

const populateResult = (hook) => {
	hook.result.userId = hook.result.account.userId; // required by event listeners
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
		injectUserId,
		(context) => { delete context.params.provider; return context; },
		// isActivated,
	],
	remove: [(context) => { delete context.params.provider; return context; }],
};

exports.after = {
	create: [],
	remove: [populateResult],
};
