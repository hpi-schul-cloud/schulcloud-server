'use strict';

const service = require('feathers-mongoose');
const account = require('./model');
const hooks = require('./hooks');
const hooksCJWT = require('./hooksCJWT');
const CryptoJS = require("crypto-js");
const RandExp = require('randexp');
const Chance = require('chance');
const chance = new Chance();

class CustomJWTService {
	constructor(authentication) {
		this.authentication = authentication;
	}

	create(data) {
		return account.findOne({"userId": data.userId})
			.then((account) => {
				let header = {
					"alg": "HS256",
					"typ": "access"
				};

				let data = {
					"accountId": account._id,
					"userId": account.userId,
					"iat": new Date().valueOf(),
					"exp": new Date().valueOf() + 86400,
					"aud": "https://schul-cloud.org",
					"iss": "feathers",
					"sub": "anonymous"
				};

				let secret = this.authentication;

				function base64url(source) {
					// Encode in classical base64
					let encodedSource = CryptoJS.enc.Base64.stringify(source);

					// Remove padding equal characters
					encodedSource = encodedSource.replace(/=+$/, '');

					// Replace characters according to base64url specifications
					encodedSource = encodedSource.replace(/\+/g, '-');
					encodedSource = encodedSource.replace(/\//g, '_');

					return encodedSource;
				}

				let stringifiedHeader = CryptoJS.enc.Utf8.parse(JSON.stringify(header));
				let encodedHeader = base64url(stringifiedHeader);

				let stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(data));
				let encodedData = base64url(stringifiedData);

				let signature = encodedHeader + "." + encodedData;
				signature = CryptoJS.HmacSHA256(signature, secret);
				signature = base64url(signature);

				return encodedHeader + '.' + encodedData + '.' + signature;
			}).catch((error) => {
				return error;
			});
	}
}

function randomGen(arr) {
	let pos = Math.floor(Math.random() * arr.length);
	let tempEle = arr[pos];

	arr = arr.filter(item => item !== tempEle);

	if (arr.length === 0)
		return tempEle;

	return tempEle + randomGen(arr);
}

class PasswordGenService {
	/**
	 * generates a random String depending on the query params
	 * @param query (length<Integer> | readable<Boolean>)
	 * @returns {Promise.<TResult>}
	 */
	find({query, payload}) {
		if (query.readable) {
			let p2 = new Promise((resolve, reject) => {
				let arr = [chance.first(), chance.last(), chance.character({symbols: true}), chance.natural({min: 0, max: 9999})];

				resolve(randomGen(arr));
			});

			return p2.then(res => {
				return res;
			});
		}

		let length = (query.length) ? query.length : 255;
		let minLength = (query.length) ? query.length : 8;

		let p1 = new Promise((resolve, reject) => {
			resolve(new RandExp("^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z])(?=.*[\-_!<>§$%&\/()=?\\;:,.#+*~']).{" + minLength + "," + length + "}$").gen());
		});

		return p1.then(res => {
			return res;
		});
	}
}

module.exports = function () {
	const app = this;

	const options = {
		Model: account,
		paginate: false,
		lean: true
	};

	// Initialize our service with any options it requires

	app.use('/accounts/pwgen', new PasswordGenService());

	app.use('/accounts', service(options));

	app.use('/accounts/jwt', new CustomJWTService(app.get("secrets").authentication));


	app.use('/accounts/confirm', {
		create(data, params) {
			return account.update({_id: data.accountId}, {$set: {activated: true}});
		}
	});

	// Get our initialize service to that we can bind hooks
	const customJWTService = app.service('/accounts/jwt');
	const accountService = app.service('/accounts');

	// Set up our before hooks
	customJWTService.before(hooksCJWT.before);
	accountService.before(hooks.before);

	// Set up our after hooks
	customJWTService.after(hooksCJWT.after);
	accountService.after(hooks.after);
};
