const passwordRecovery = require('./model');
const { passwordRecoveryHooks, resetPassworkHooks } = require('./hooks');
const AccountModel = require('../account/model');
const ChangePasswordService = require('./services/ChangePasswordService');
const GenerateRecoveryPasswordTokenService = require('./services/GenerateRecoveryPasswordTokenService');

module.exports = function setup() {
	const app = this;

	app.use('/passwordRecovery', new GenerateRecoveryPasswordTokenService(passwordRecovery));
	app.use('/passwordRecovery/reset', new ChangePasswordService(passwordRecovery, AccountModel));
	const passwordRecoveryService = app.service('/passwordRecovery');
	const changePasswordService = app.service('/passwordRecovery/reset');

	passwordRecoveryService.hooks(passwordRecoveryHooks);
	changePasswordService.hooks(resetPassworkHooks);
};
