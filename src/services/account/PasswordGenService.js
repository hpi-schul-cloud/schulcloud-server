/* eslint-disable no-param-reassign */
/* eslint-disable class-methods-use-this */
const Chance = require('chance');
const RandExp = require('randexp');

const chance = new Chance();

function randomGen(arr) {
	const pos = Math.floor(Math.random() * arr.length);
	const tempEle = arr[pos];

	arr = arr.filter(item => item !== tempEle);

	if (arr.length === 0) {
		return tempEle;
	}

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

			return p2.then(res => res);
		}

		const length = (query.length) ? query.length : 255;
		const minLength = (query.length) ? query.length : 8;

		const p1 = new Promise((resolve) => {
			resolve(new RandExp(`^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z])(?=.*[\-_!<>§$%&\/()=?\\;:,.#+*~']).{${minLength},${length}}$`).gen());
		});

		return p1.then(res => res);
	}
}

module.exports = PasswordGenService;
