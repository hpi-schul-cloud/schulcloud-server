const { userModel } = require('../../user/model');

class Test {
	constructor(options) {
		this.options = options || {};
		this.docs = {};
	}

	async find() {
		const [user1, user2] = await userModel.find({}).limit(2).exec();
		const fakeData = { users: [user2.id] };
		const fakeParams = { account: { userId: user1.id } };

		return this.app.service('/editor/lessons').create(fakeData, fakeParams);
	}

	setup(app) {
		this.app = app;
	}
}

module.exports = Test;
