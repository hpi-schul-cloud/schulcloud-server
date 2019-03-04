const CryptoJS = require('crypto-js');

const accountModel = require('./model');

class CustomJWTService {
	constructor(authentication) {
		this.authentication = authentication;
	}

	create({ userId }) {
		return accountModel.findOne({ userId })
			.then((account) => {
				const header = {
					alg: 'HS256',
					typ: 'access',
				};

				const jwtData = {
					accountId: account._id,
					userId: account.userId,
					iat: new Date().valueOf(),
					exp: new Date().valueOf() + 86400,
					aud: 'https://schul-cloud.org',
					iss: 'feathers',
					sub: 'anonymous',
				};

				const secret = this.authentication;

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

				const stringifiedHeader = CryptoJS.enc.Utf8.parse(JSON.stringify(header));
				const encodedHeader = base64url(stringifiedHeader);

				const stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(jwtData));
				const encodedData = base64url(stringifiedData);

				let signature = `${encodedHeader}.${encodedData}`;
				signature = CryptoJS.HmacSHA256(signature, secret);
				signature = base64url(signature);

				return `${encodedHeader}.${encodedData}.${signature}`;
			}).catch(error => error);
	}
}

module.exports = CustomJWTService;
