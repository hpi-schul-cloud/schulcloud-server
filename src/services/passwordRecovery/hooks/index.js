const { authenticate } = require('@feathersjs/authentication');
const local = require('@feathersjs/authentication-local');
const { NotFound } = require('@feathersjs/errors');
const logger = require('../../../logger/index');
const { HOST } = require('../../../../config/globals');

const globalHooks = require('../../../hooks');

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
			const recoveryLink = `${HOST}/pwrecovery/${context.result._id}`;
			const mailContent = `Sehr geehrte/r ${account.userId.firstName} ${account.userId.lastName}, \n
Bitte setzen Sie Ihr Passwort unter folgendem Link zurück:
${recoveryLink}\n
Mit Freundlichen Grüßen
Ihr ${process.env.SC_SHORT_TITLE || 'Schul-Cloud'} Team`;

			globalHooks.sendEmail(context, {
				subject: `Passwort zurücksetzen für die ${process.env.SC_SHORT_TITLE || 'Schul-Cloud'}`,
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

/**
 * this hides errors from api for invalid input
 * @param {*} context
 */
const return200 = (context) => {
	if (context.error) {
		logger.warning('return 200');
		context.error.code = 200;
		context.result = { success: 'success' };
	}
	return context;
};

exports.before = {
	all: [],
	find: [
		authenticate('jwt'),
		globalHooks.hasPermission('PWRECOVERY_VIEW'),
	],
	get: [],
	create: [
		resolveUserIdByUsername,
		local.hooks.hashPassword('password'),
	],
	update: [
		authenticate('jwt'),
		globalHooks.hasPermission('PWRECOVERY_EDIT'),
	],
	patch: [
		authenticate('jwt'),
		globalHooks.hasPermission('PWRECOVERY_EDIT'),
		globalHooks.permitGroupOperation,
	],
	remove: [
		authenticate('jwt'),
		globalHooks.hasPermission('PWRECOVERY_CREATE'),
		globalHooks.permitGroupOperation,
	],
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [sendInfo],
	update: [],
	patch: [],
	remove: [],
};

exports.error = {
	create: [return200],
};
