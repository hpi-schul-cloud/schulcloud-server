const local = require('@feathersjs/authentication-local');
const { NotFound } = require('@feathersjs/errors');
const { Configuration } = require('@schul-cloud/commons');
const {
	iff, isProvider, disallow, keep,
} = require('feathers-hooks-common');
const logger = require('../../../logger/index');
const { HOST, SC_SHORT_TITLE } = require('../../../../config/globals');

const globalHooks = require('../../../hooks');
const { randomStringAsBase64Url } = require('../../../utils/randomNumberGenerator');


/**
 *	if only hook.username is given, this tries to resolve the users id
 * @param {*} hook
 */
const resolveUserIdByUsername = (hook) => {
	if (hook.data
		&& !hook.data.password
		&& hook.data.username
	) {
		const accountService = hook.app.service('/accounts');

		const { username } = hook.data;
		return accountService.find({
			query: {
				username,
			},
		}).then((accounts) => {
			if (Array.isArray(accounts) && accounts.length !== 0 && accounts[0]._id) {
				hook.data.account = accounts[0]._id;
				return hook;
			}
			throw new NotFound('username not found');
		});
	}
	return hook;
};

const sendInfo = (context) => {
	if (context.path === 'passwordRecovery') {
		return context.app.service('/accounts').get(context.data.account, {
			query: {
				$populate: ['userId'],
			},
		}).then((account) => {
			const recoveryLink = `${HOST}/pwrecovery/${context.result.token}`;
			const mailContent = `Sehr geehrte/r ${account.userId.firstName} ${account.userId.lastName}, \n
Bitte setzen Sie Ihr Passwort unter folgendem Link zurück:
${recoveryLink}\n
Bitte beachten Sie das der Link nur für 6 Stunden gültig ist. Danach müssen sie ein neuen Link anfordern.\n
Mit Freundlichen Grüßen
Ihr ${SC_SHORT_TITLE} Team`;

			globalHooks.sendEmail(context, {
				subject: `Passwort zurücksetzen für die ${SC_SHORT_TITLE}`,
				emails: [account.userId.email],
				content: {
					text: mailContent,
				},
			});
			logger.info(`send password recovery information to userId ${account.userId._id}`);
			return context;
		}).catch((err) => {
			logger.warning(err);
			throw new NotFound('User Account Not Found');
		});
	}
	return context;
};

const generateToken = (context) => {
	const bitSize = 24;
	context.data.token = randomStringAsBase64Url(bitSize);
	return context;
};


const clearResult = (context) => {
	context.result = { success: 'success' };
	return context;
};

/**
 * this hides errors from api for invalid input
 * @param {*} context
 */
const clearResultAndForceSuccessIfNotBlockedEmailDomain = (context) => {
	// Only pass error: Email Domain Blocked
	if (context.error && context.error.code === 400 && context.error.message === 'EMAIL_DOMAIN_BLOCKED') {
		return context;
	}

	// Mute other errors
	if (context.error) {
		delete context.error.hook;
		// context.error.code = 200;
		logger.error('passwordRecovery is requested and return an error: ', context.error);
	}

	return clearResult(context);
};


const passwordRecoveryHooks = {
	before: {
		all: [],
		find: [iff(isProvider('external'), disallow())],
		get: [],
		create: [
			globalHooks.blockDisposableEmail('username'),
			resolveUserIdByUsername,
			generateToken,
			local.hooks.hashPassword('password'),
		],
		update: [iff(isProvider('external'), disallow())],
		patch: [iff(isProvider('external'), disallow())],
		remove: [iff(isProvider('external'), disallow())],
	},

	after: {
		all: [],
		find: [],
		get: [keep('_id, createdAt', 'changed')],
		create: [sendInfo, clearResult],
		update: [],
		patch: [],
		remove: [],
	},

	error: {
		create: [],
	},
};

const resetPassworkHooks = {
	before: {
		all: [],
		find: [iff(isProvider('external'), disallow())],
		get: [],
		create: [
			globalHooks.blockDisposableEmail('username'),
			generateToken,
			local.hooks.hashPassword('password'),
		],
		update: [iff(isProvider('external'), disallow())],
		patch: [iff(isProvider('external'), disallow())],
		remove: [iff(isProvider('external'), disallow())],
	},

	after: {
		all: [],
		find: [],
		get: [keep('_id, createdAt', 'changed')],
		create: [sendInfo, clearResult],
		update: [],
		patch: [],
		remove: [],
	},

	error: {
		create: [],
	},
};

module.exports = { passwordRecoveryHooks, resetPassworkHooks };
