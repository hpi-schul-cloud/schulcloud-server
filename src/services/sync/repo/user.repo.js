const accountModel = require('../../account/model');
const { userModel } = require('../../user/model');

const createAccount = async (account) => {
	return accountModel.create({
		userId: account.userId,
		username: account.username.toLowerCase(),
		systemId: account.systemId,
		activated: true,
	});
};

const createUserAndAccount = async (inputUser, inputAccount) => {
	const user = await userModel.create(inputUser);
	inputAccount.userId = user._id;
	const account = await createAccount(inputAccount);
	return { user, account };
};

const updateAccount = async (userId, account) => {
	return accountModel.patch(
		{ userId, systemId: account.systemId },
		{
			username: account.username,
			userId,
			systemId: account.systemId,
			activated: true,
		},
		{ upsert: true }
	);
};

const updateUserAndAccount = async (userId, changedUser, changedAccount) => {
	const user = await userModel.patch(userId, changedUser);
	const account = await updateAccount(userId, changedAccount);
	return { user, account };
};

const findByLdapIdAndSchool = async (ldapId, schoolId) => {
	return userModel
		.findOne({
			ldapId,
			schoolId,
		})
		.populate('roles')
		.lean()
		.exec();
};

module.exports = {
	createUserAndAccount,
	updateUserAndAccount,
	findByLdapIdAndSchool,
};
