const accountModel = require('../../../services/account/model');

const getUserAccount = async (userId) => {
	const account = await accountModel.findOne({ userId }).lean().exec();
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
