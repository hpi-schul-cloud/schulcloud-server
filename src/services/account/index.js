// const RandExp = require('randexp');
// const Chance = require('chance');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const account = require('./model');

// const { getRandomInt } = require('../../utils/randomNumberGenerator');
const { supportJWTServiceSetup, jwtTimerServiceSetup } = require('./services');
const { accountModelService, accountModelServiceHooks } = require('./services/accountModelService');
const { accountService, accountServiceHooks } = require('./services/accountApiService');

/* @deprecated
const chance = new Chance();

function randomGen(arr) {
	const tempEle = arr[getRandomInt(arr.length - 1)];

	if (arr.length === 0) return tempEle;

	return tempEle + randomGen(arr);
}

class PasswordGenService {

    // generates a random String depending on the query params
    // @param query (length<Integer> | readable<Boolean>)
    // @returns {Promise.<TResult>}

	find({ query }) {
		if (query.readable) {
			const p2 = new Promise((resolve) => {
				const arr = [
					chance.first(),
					chance.last(),
					chance.character({ symbols: true }),
					chance.natural({ min: 0, max: 9999 }),
				];

				resolve(randomGen(arr));
			});

			return p2.then((res) => res);
		}

		const length = (query.length) ? query.length : 255;
		const minLength = (query.length) ? query.length : 8;

		const p1 = new Promise((resolve) => {
			// eslint-disable-next-line max-len
			resolve(new RandExp(`^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z])(?=.*[-_!<>§$%&/()=?\\;:,.#+*~']).{${minLength},${length}}$`).gen());
		});

		return p1.then((res) => res);
	}
}
*/
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
