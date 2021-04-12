const { userModel } = require('../../../../../src/services/user/model');
const accountModel = require('../../../../../src/services/account/model');

const deleteUser = async (email = 'foo@bar.baz') => {
	await userModel.deleteOne({ email });
	await accountModel.deleteOne({ username: email });
};

class MockEmailService {
	constructor(eventHandler) {
		this.eventHandler = eventHandler;
	}

	create({ subject, content }, params) {
		this.eventHandler({ subject, content, params });
		return Promise.resolve();
	}
}

module.exports = {
	deleteUser,
	MockEmailService,
};
