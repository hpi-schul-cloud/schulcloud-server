const { JWTStrategy } = require('@feathersjs/authentication');
const cookie = require('cookie');
const { ObjectId } = require('mongoose').Types;

class CustomJwtStrategy extends JWTStrategy {
	async getEntity(accountId) {
		const account = await this.app.service('nest-account-service').findById(accountId);
		account._id = account.id;
		account.userId = new ObjectId(account.userId);

		return account;
	}

	async parse(req) {
		const cookies = cookie.parse(req.headers.cookie || '');
		if (cookies && cookies.jwt) {
			return Promise.resolve({
				strategy: this.name,
				accessToken: cookies.jwt,
			});
		}
		return super.parse(req);
	}
}

module.exports = CustomJwtStrategy;
