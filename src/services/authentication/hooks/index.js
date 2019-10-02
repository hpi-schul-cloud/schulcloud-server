const injectUserId = async (context) => {
	const { systemId, schoolId, strategy } = context.data;

	if (schoolId) {
		await context.app.service('schools').get(schoolId).then((school) => {
			if (strategy === 'ldap') {
				context.data.username = `${school.ldapSchoolIdentifier}/${context.data.username}`;
			}
		});
	}

	return context.app.service('/accounts').find({
		query: {
			username: context.data.username,
			systemId,
		},
		paginate: false,
	}).then(async ([account]) => {
		if (account) {
			context.params.payload = {};
			context.params.payload.accountId = account._id;
			if (account.userId) {
				context.params.payload.userId = account.userId;
			}
			if (account.systemId) {
				context.params.payload.systemId = account.systemId;
			}
		} else if (['moodle', 'iserv'].includes(strategy)) {
			const accountParameters = {
				username: context.data.username,
				password: context.data.password,
				strategy,
				systemId,
			};
			const newAccount = await context.app.service('accounts').create(accountParameters);
			context.params.payload = {};
			context.params.payload.accountId = newAccount._id;
			if (newAccount.systemId) {
				context.params.payload.systemId = newAccount.systemId;
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

// Requests need to be used after authentication as inner server calls
// Provider is not allowed to be set to detect it as inner server call
const removeProvider = (context) => {
	delete context.params.provider;
	return context;
};

exports.before = {
	create: [
		lowerCaseUsername,
		injectUserId,
		removeProvider,
	],
	remove: [removeProvider],
};

exports.after = {
	create: [],
	remove: [populateResult],
};
