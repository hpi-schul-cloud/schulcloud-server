const auth = require('@feathersjs/authentication');
const local = require('@feathersjs/authentication-local');
const { NotFound } = require('@feathersjs/errors');
const logger = require('winston');

const globalHooks = require('../../../hooks');

const hashId = (hook) => {
	if (!hook.data.password) {
		const accountService = hook.app.service('/accounts');

		const { username } = hook.data;
		return accountService.find({
			query: {
				username,
			},
		}).then((account) => {
			account = account[0];
			hook.data.account = account._id;
		});
	}
};

const sendInfo = (context) => {
	if (context.path === 'passwordRecovery') {
		return context.app.service('/accounts').get(context.data.account, {
			query: {
				$populate: ['userId'],
			},
		}).then((account) => {
			const recoveryLink = `${process.env.HOST}/pwrecovery/${context.result._id}`;
			const mailContent = `Sehr geehrte/r " ${account.userId.firstName} ${account.userId.lastName}, \n\n
				Bitte setzen Sie Ihr Passwort unter folgendem Link zurück:\n
				${recoveryLink}\n\n
				Mit Freundlichen Grüßen\n
				Ihr ${process.env.SC_SHORT_TITLE || 'Schul-Cloud'} Team`;

			globalHooks.sendEmail(context, {
				subject: `Passwort zurücksetzen für die ${process.env.SC_SHORT_TITLE || 'Schul-Cloud'}`,
				emails: [account.userId.email],
				content: {
					text: mailContent,
				},
			});
			return context;
		}).catch((err) => {
			logger.warn(err);
			throw new NotFound('User Account Not Found');
		});
	}
	return context;
};

exports.before = {
	all: [],
	find: [
		auth.hooks.authenticate('jwt'),
		globalHooks.hasPermission('PWRECOVERY_VIEW'),
	],
	get: [],
	create: [
		hashId,
		local.hooks.hashPassword({ passwordField: 'password' }),
	],
	update: [
		auth.hooks.authenticate('jwt'),
		globalHooks.hasPermission('PWRECOVERY_EDIT'),
	],
	patch: [
		auth.hooks.authenticate('jwt'),
		globalHooks.hasPermission('PWRECOVERY_EDIT'),
		globalHooks.permitGroupOperation,
	],
	remove: [
		auth.hooks.authenticate('jwt'),
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
