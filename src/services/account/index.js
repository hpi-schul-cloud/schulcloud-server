// const RandExp = require('randexp');
// const Chance = require('chance');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const account = require('./model');

// const { getRandomInt } = require('../../utils/randomNumberGenerator');
const { supportJWTServiceSetup, jwtTimerServiceSetup } = require('./services');
const { accountModelService, accountModelServiceHooks } = require('./services/accountModelService');
const { accountService, accountServiceHooks } = require('./services/accountApiService');

module.exports = (app) => {
	app.use('/accounts/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));
	app.use('/accountModel', accountModelService);
	app.service('/accountModel').hooks(accountModelServiceHooks);

	app.use('accounts', accountService);
	app.service('/accounts').hooks(accountServiceHooks);

	// app.use('/accounts/pwgen', new PasswordGenService());

	app.configure(jwtTimerServiceSetup);

	app.configure(supportJWTServiceSetup);

	app.use('/accounts/confirm', {
		create(data, params) {
			return account.update({ _id: data.accountId }, { $set: { activated: true } });
		},
	});
};
