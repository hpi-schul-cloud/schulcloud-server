const { keep } = require('feathers-hooks-common');
const { Configuration } = require('@hpi-schul-cloud/commons');

const { NotFound, BadRequest } = require('../../../errors');
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
		this.app = app;
	}

	async get(id) {
		return this.passwordRecovery.findOne({
			token: id,
		});
	}

	async create(data) {
		if (data && data.username) {
			const { username } = data;
			const accountsResult = await this.app.service('nest-account-service').searchByUsernameExactMatch(username);
			const [accounts, total] = accountsResult;

			if (total !== 0 && Array.isArray(accounts) && accounts[0].id) {
				data.account = accounts[0].id;
				data.user = accounts[0].userId;
				const recoveryModel = await PasswordRecoveryModel.create({
					account: accounts[0].id,
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
			.service('/users')
			.get(context.data.user)
			.then((user) => {
				const recoveryLink = `${HOST}/pwrecovery/${context.result.token}`;
				const mailContent = `Sehr geehrte/r ${user.firstName} ${user.lastName}, \n
							Bitte setzen Sie Ihr Passwort unter folgendem Link zurück:
							${recoveryLink}\n
							Bitte beachten Sie das der Link nur für 6 Stunden gültig ist. Danach müssen sie ein neuen Link anfordern.\n
							Mit Freundlichen Grüßen
							Ihr ${SC_SHORT_TITLE} Team`;

				globalHooks.sendEmail(context, {
					subject: `Passwort zurücksetzen für die ${SC_SHORT_TITLE}`,
					emails: [user.email],
					content: {
						text: mailContent,
					},
				});
				logger.info(`send password recovery information to userId ${user._id}`);
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
		create: [globalHooks.blockDisposableEmail('username')],
	},

	after: {
		get: [keep('_id, createdAt', 'changed')],
		create: [sendInfo, clearResult],
	},
};

module.exports = { GenerateRecoveryPasswordTokenService, hooks };
