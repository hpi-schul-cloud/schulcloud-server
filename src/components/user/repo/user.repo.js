const { userModel: User } = require('../../../services/user/model');

module.exports = class UserRepo {
	setup(app) {
		this.userService = app.service('users');
	}

	async getUser(id) {
		return this.userService.get(id);
	}

	async replaceUserWithTombstone(id, replaceData = {}) {
		const user = await this.getUser(id);

		return User.replaceOne(
			{ _id: user._id },
			{
				...replaceData,
				deletedAt: new Date(),
			}
		);
	}
}
