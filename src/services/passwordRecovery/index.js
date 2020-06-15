const { BadRequest, GeneralError } = require('@feathersjs/errors');
const service = require('feathers-mongoose');
const { SilentError } = require('../../middleware/errors');
const passwordRecovery = require('./model');
const { passwordRecoveryHooks, resetPassworkHooks } = require('./hooks');
const logger = require('../../logger/index');
const AccountModel = require('../account/model');


const MAX_LIVE_TIME = 6 * 60 * 60 * 1000; // 6 hours

class ChangePasswordService {
	async create(data) {

		delete data.password_control;
		delete data.accountId;

		if (Object.keys(data).length !== 3) {
			throw new BadRequest('Malformed request body.');
		}

		const pwrecover = await passwordRecovery.findOne({ token: data.resetId });
		if (!pwrecover || !pwrecover.changed) {
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
				AccountModel.update({ _id: pwrecover.account }, { password: data.password }).lean().exec(),
				passwordRecovery.updateOne({ _id: data.resetId }, { $set: { changed: true } }).lean().exec(),
			]).catch((err) => {
				throw new GeneralError('passwordRecovery can not patch data', err);
			});
		} catch (err) {
			throw new GeneralError('passwordRecovery unexpected error', err);
		}
		return { success: 'success' };
	}
}

module.exports = function setup() {
	const app = this;

	const options = {
		Model: passwordRecovery,
		paginate: {
			default: 1,
			max: 1,
		},
		lean: true,
	};

	app.use('/passwordRecovery', service(options));
	app.use('/passwordRecovery/reset', new ChangePasswordService());
	const passwordRecoveryService = app.service('/passwordRecovery');
	const changePasswordService = app.service('/passwordRecovery/reset');

	passwordRecoveryService.hooks(passwordRecoveryHooks);
	changePasswordService.hooks(resetPassworkHooks);
};
