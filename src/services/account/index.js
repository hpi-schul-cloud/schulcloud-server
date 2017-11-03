'use strict';

const service = require('feathers-mongoose');
const account = require('./model');
const hooks = require('./hooks');
const hooksCJWT = require('./hooksCJWT');
const CryptoJS = require("crypto-js");

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

module.exports = function () {
	const app = this;

	const options = {
		Model: account,
		paginate: false,
		lean: true
	};

	// Initialize our service with any options it requires
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
