const accountModel = require('../../../services/account/model');
const { NotFound } = require('../../../errors');

const getUserAccount = async (userId) => {
	const account = await accountModel.findOne({ userId }).lean().exec();
	if (account == null) {
		throw new NotFound('no account for this user');
	}
	return account;
};

const deleteAccountForUserId = async (userId) => {
	const result = await accountModel.findOneAndRemove({ userId }).lean().exec();
	return result;
};

module.exports = {
	getUserAccount,
	deleteAccountForUserId,
};
