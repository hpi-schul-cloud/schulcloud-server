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
	// (await User.create(user)).toObject()
	const user = (await userModel.create(inputUser)).toObject();
	inputAccount.userId = user._id;
	const account = (await createAccount(inputAccount)).toObject();
	return { user, account };
};

const updateAccount = async (userId, account) => {
	return accountModel
		.findOneAndUpdate(
			{ userId, systemId: account.systemId },
			{
				username: account.username,
				activated: true,
			},
			{ new: true }
		)
		.lean()
		.exec();
};

const updateUserAndAccount = async (userId, changedUser, changedAccount) => {
	const user = await userModel.findOneAndUpdate({ _id: userId }, changedUser, { new: true }).lean().exec();
	const account = await accountModel
		.findOneAndUpdate(
			{ userId, systemId: changedAccount.systemId },
			{
				username: changedAccount.username,
				activated: true,
			},
			{ new: true }
		)
		.lean()
		.exec();
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

const UserRepo = {
	createUserAndAccount,
	updateUserAndAccount,
	findByLdapIdAndSchool,
};

module.exports = UserRepo;
