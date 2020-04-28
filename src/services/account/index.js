const service = require('feathers-mongoose');
const RandExp = require('randexp');
const Chance = require('chance');

const account = require('./model');
const hooks = require('./hooks');

const { supportJWTServiceSetup, jwtTimerServiceSetup } = require('./services');

const chance = new Chance();

function randomGen(arr) {
	const pos = Math.floor(Math.random() * arr.length);
	const tempEle = arr[pos];

	arr = arr.filter((item) => item !== tempEle);

	if (arr.length === 0) return tempEle;

	return tempEle + randomGen(arr);
}

class PasswordGenService {
	/**
     * generates a random String depending on the query params
     * @param query (length<Integer> | readable<Boolean>)
     * @returns {Promise.<TResult>}
     */
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
			resolve(new RandExp(`^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z])(?=.*[\-_!<>§$%&\/()=?\\;:,.#+*~']).{${minLength},${length}}$`).gen());
		});

		return p1.then((res) => res);
	}
}

module.exports = (app) => {
	const options = {
		Model: account,
		paginate: false,
		lean: true,
	};

	// Initialize our service with any options it requires

	app.use('/accounts/pwgen', new PasswordGenService());

	app.configure(jwtTimerServiceSetup);

	app.use('/accounts', service(options));

	app.configure(supportJWTServiceSetup);

	app.use('/accounts/confirm', {
		create(data, params) {
			return account.update({ _id: data.accountId }, { $set: { activated: true } });
		},
	});

	// Get our initialize service to that we can bind hooks
	const accountService = app.service('/accounts');

	accountService.hooks(hooks);
};
