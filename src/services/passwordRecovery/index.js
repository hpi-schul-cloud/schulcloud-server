const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const passwordRecovery = require('./model');
const AccountModel = require('../account/model');
const { ChangePasswordService, hooks: changePasswordServiceHooks } = require('./services/ChangePasswordService');
const {
	GenerateRecoveryPasswordTokenService,
	hooks: generateRecoveryPasswordHooks,
} = require('./services/GenerateRecoveryPasswordTokenService');

module.exports = function setup() {
	const app = this;

	app.use('/passwordRecovery', new GenerateRecoveryPasswordTokenService(passwordRecovery));
	app.use('/passwordRecovery/reset', new ChangePasswordService(passwordRecovery, AccountModel));
	app.use('/passwordRecovery/api', staticContent(path.join(__dirname, '/docs')));

	const passwordRecoveryService = app.service('/passwordRecovery');
	const changePasswordService = app.service('/passwordRecovery/reset');

	passwordRecoveryService.hooks(generateRecoveryPasswordHooks);
	changePasswordService.hooks(changePasswordServiceHooks);
};
