const { keep } = require('feathers-hooks-common');
const local = require('@feathersjs/authentication-local');
const { Configuration } = require('@hpi-schul-cloud/commons');
const reqlib = require('app-root-path').require;

const { NotFound, BadRequest } = reqlib('src/errors');
const PasswordRecoveryModel = require('../model');
const { randomStringAsBase64Url } = require('../../../utils/randomNumberGenerator');
const globalHooks = require('../../../hooks');
const logger = require('../../../logger/index');
const { SC_SHORT_TITLE } = require('../../../../config/globals');

const HOST = Configuration.get('HOST');

class GenerateRecoveryPasswordTokenService {
	constructor(passwordRecovery) {
		this.passwordRecovery = passwordRecovery;
	}

	setup(app) {
		this.accountsService = app.service('/accounts');
	}

	async get(id) {
		return this.passwordRecovery.findOne({
			token: id,
		});
	}

	async create(data) {
		if (data && data.username) {
			const { username } = data;
			const accounts = await this.accountsService.find({
				query: {
					username,
				},
			});

			if (Array.isArray(accounts) && accounts.length !== 0 && accounts[0]._id) {
				data.account = accounts[0]._id;
				const recoveryModel = await PasswordRecoveryModel.create({
					account: accounts[0]._id,
					token: randomStringAsBase64Url(24),
				});
				return recoveryModel;
			}
			throw new NotFound('Username not found!');
		}
		throw new BadRequest('Username was not provided!');
	}
}

const sendInfo = (context) => {
	if (context.path === 'passwordRecovery') {
		return context.app
			.service('/accounts')
			.get(context.data.account, {
				query: {
					$populate: ['userId'],
				},
			})
			.then((account) => {
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
			})
			.catch((err) => {
				logger.warning(err);
				throw new NotFound('User Account Not Found');
			});
	}
	return context;
};

const clearResult = (context) => {
	context.result = { success: 'success' };
	return context;
};

const hooks = {
	before: {
		create: [globalHooks.blockDisposableEmail('username'), local.hooks.hashPassword('password')],
	},

	after: {
		get: [keep('_id, createdAt', 'changed')],
		create: [sendInfo, clearResult],
	},
};

module.exports = { GenerateRecoveryPasswordTokenService, hooks };
