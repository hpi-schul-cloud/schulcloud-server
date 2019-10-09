const { TooManyRequests } = require('@feathersjs/errors');

const updateUsernameForLDAP = async (context) => {
	const { schoolId, strategy } = context.data;

	if (strategy !== 'jwt') {
		if (schoolId) {
			await context.app.service('schools').get(schoolId).then((school) => {
				if (strategy === 'ldap') {
					context.data.username = `${school.ldapSchoolIdentifier}/${context.data.username}`;
				}
			});
		}
	}
	return context;
};

const bruteForceCheck = async (context) => {
	const { systemId, strategy } = context.data;

	if (strategy !== 'jwt') {
		const [account] = await context.app.service('/accounts').find({
			query: {
				username: context.data.username,
				systemId,
			},
			paginate: false,
		});

		// if account doesn't exist we can not update (e.g. iserv, moodle)
		if (account) {
			if (account.lastTriedLogin) {
				const allowedTimeDifference = process.env.LOGIN_BLOCK_TIME || 15;
				const timeDifference = (Date.now() - account.lastTriedLogin) / 1000;
				if (timeDifference < allowedTimeDifference) {
					throw new TooManyRequests(
						'Brute Force Prevention!', {
							timeToWait: allowedTimeDifference - Math.ceil(timeDifference),
						},
					);
				}
			}
			// set current time to last tried login
			await context.app.service('/accounts').patch(account._id, { lastTriedLogin: Date.now() });
		}
	}
	return context;
};

// Invalid Login will not call this function
const bruteForceReset = async (context) => {
	// if successful login enable next login try directly
	await context.app.service('/accounts').patch(context.result.account._id, { lastTriedLogin: 0 });
	return context;
};

const injectUserId = async (context) => {
	const { systemId, strategy } = context.data;

	if (strategy !== 'jwt') {
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
	}
	return context;
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
		updateUsernameForLDAP,
		bruteForceCheck,
		injectUserId,
		removeProvider,
	],
	remove: [removeProvider],
};

exports.after = {
	create: [bruteForceReset],
	remove: [populateResult],
};
