const { JWTStrategy } = require('@feathersjs/authentication');
const { ObjectId } = require('mongoose').Types;

class CustomJwtStrategy extends JWTStrategy {
	async getEntity(accountId) {
		const account = await this.app.service('nest-account-service').findById(accountId);
		account._id = new ObjectId(account.id);
		return account;
	}
}

module.exports = CustomJwtStrategy;
