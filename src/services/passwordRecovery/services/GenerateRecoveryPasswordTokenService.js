const { NotFound, BadRequest } = require('@feathersjs/errors');
const PasswordRecoveryModel = require('../model');
const { randomStringAsBase64Url } = require('../../../utils/randomNumberGenerator');

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

module.exports = GenerateRecoveryPasswordTokenService;
