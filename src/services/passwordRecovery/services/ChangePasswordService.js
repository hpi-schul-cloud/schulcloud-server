const local = require('@feathersjs/authentication-local');

const { BadRequest, GeneralError, SilentError } = require('../../../errors');
const logger = require('../../../logger/index');
const globalHooks = require('../../../hooks');

const MAX_LIVE_TIME = 6 * 60 * 60 * 1000; // 6 hours

class ChangePasswordService {
	constructor(passwordRecoveryModel, accountModel) {
		this.passwordRecoveryModel = passwordRecoveryModel;
		this.accountModel = accountModel;
	}

	async create(data) {
		if (Object.keys(data).length < 3) {
			throw new BadRequest('Malformed request body.');
		}

		const pwrecover = await this.passwordRecoveryModel.findOne({ token: data.resetId });
		if (!pwrecover || pwrecover.changed) {
			delete data.password;
			throw new SilentError('Invalid token!');
		}
		const time = Date.now() - Date.parse(pwrecover.createdAt);
		if (time >= MAX_LIVE_TIME) {
			logger.info('passwordRecovery is requested but the link is too old.', { time: `${time * 0.001} sec` });
			throw new SilentError('Token expired!');
		}
		try {
			await Promise.all([
				this.accountModel
					.updateOne({ _id: pwrecover.account }, { $set: { password: data.password } })
					.lean()
					.exec(),
				this.passwordRecoveryModel
					.updateOne({ token: data.resetId }, { $set: { changed: true } })
					.lean()
					.exec(),
			]).catch((err) => {
				throw new GeneralError('passwordRecovery can not patch data', err);
			});
		} catch (err) {
			throw new GeneralError('passwordRecovery unexpected error', err);
		}
		return SilentError.RESPONSE_CONTENT;
	}
}

const hooks = {
	before: {
		create: [globalHooks.blockDisposableEmail('username'), local.hooks.hashPassword('password')],
	},
};

module.exports = { ChangePasswordService, hooks };
