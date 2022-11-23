const local = require('@feathersjs/authentication-local');

const { BadRequest, GeneralError, SilentError } = require('../../../errors');
const logger = require('../../../logger/index');
const globalHooks = require('../../../hooks');

const MAX_LIVE_TIME = 6 * 60 * 60 * 1000; // 6 hours

class ChangePasswordService {
	constructor(passwordRecoveryModel, app) {
		this.passwordRecoveryModel = passwordRecoveryModel;
		this.app = app;

		this.errors = {
			inputValidation: 'Malformed request body.',
			expired: 'Token expired!',
			notExist: 'Token not exist!',
			general: 'passwordRecovery unexpected error',
		};
	}

	async create(data = {}) {
		const { resetId, password } = data;

		if (!resetId || !password || typeof resetId !== 'string') {
			throw new BadRequest(this.errors.inputValidation);
		}

		const token = resetId.toString();

		const pwrecover = await this.passwordRecoveryModel.findOne({ token });
		if (!pwrecover) {
			throw new SilentError(this.errors.notExist);
		}
		const time = Date.now() - Date.parse(pwrecover.createdAt);
		if (time >= MAX_LIVE_TIME || pwrecover.changed !== false) {
			logger.info('passwordRecovery is requested but the link is too old.', { time: `${time * 0.001} sec` });
			throw new SilentError(this.errors.expired);
		}
		try {
			await Promise.all([
				this.app.service('nest-account-service').updatePassword(pwrecover.account, password),
				this.passwordRecoveryModel
					.updateOne({ token }, { $set: { changed: true } })
					.lean()
					.exec(),
			]);
		} catch (err) {
			throw new GeneralError(this.errors.general, err);
		}
		return SilentError.RESPONSE_CONTENT;
	}
}

const hooks = {
	before: {
		create: [globalHooks.blockDisposableEmail('username')],
	},
};

module.exports = { ChangePasswordService, hooks };
