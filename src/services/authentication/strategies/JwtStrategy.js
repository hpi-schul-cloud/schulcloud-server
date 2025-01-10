const { JWTStrategy } = require('@feathersjs/authentication');
const { ObjectId } = require('mongoose').Types;

class CustomJwtStrategy extends JWTStrategy {
	async getEntity(accountId) {
		const account = await this.app.service('nest-account-service').findById(accountId);
		account._id = account.id;
		account.userId = new ObjectId(account.userId);

		return account;
	}
}

module.exports = CustomJwtStrategy;
