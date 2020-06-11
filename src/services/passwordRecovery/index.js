const service = require('feathers-mongoose');
const passwordRecovery = require('./model');
const hooks = require('./hooks');
const logger = require('../../logger/index');
const AccountModel = require('../account/model');

const MAX_LIVE_TIME = 6 * 60 * 60 * 1000; // 6 hours

class ChangePasswordService {
	async create(data) {
		try {
			delete data.password_control;
			delete data.accountId;
			const pwrecover = await passwordRecovery.findOne({ _id: data.resetId, changed: false });
			if (!pwrecover || Object.keys(data).length !== 3) {
				delete data.password;
				throw new Error(`Wrong data. ${JSON.stringify({ data, pwrecover })}`);
			}
			const time = Date.now() - Date.parse(pwrecover.createdAt);
			if (time >= MAX_LIVE_TIME) {
				logger.info('passwordRecovery is requested but the link is too old.', { time: `${time * 0.001} sec` });
				return { success: 'success' };
			}
			await Promise.all([
				AccountModel.update({ _id: pwrecover.account }, { password: data.password }).lean().exec(),
				passwordRecovery.updateOne({ _id: data.resetId }, { $set: { changed: true } }).lean().exec(),
			]).catch((err) => {
				throw new Error('passwordRecovery can not patch data', err);
			});
		} catch (err) {
			logger.error('passwordRecovery is requested and return an error', err);
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

	passwordRecoveryService.hooks(hooks);
	changePasswordService.hooks(hooks);
};
