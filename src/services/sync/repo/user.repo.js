const accountModel = require('../../account/model');
const { userModel } = require('../../user/model');
const roleModel = require('../../role/model');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;
const { BadRequest } = require('../../../errors');

const createAccount = async (account) => {
	return accountModel.create({
		userId: account.userId,
		username: account.username.toLowerCase(),
		systemId: account.systemId,
		activated: true,
	});
};

const resolveUserRoles = async (roles) => {
	return roleModel
		.find({
			name: {
				$in: roles,
			},
		})
		.lean()
		.exec();
};

const createUser = async (user) => {
	user.roles = await resolveUserRoles(user.roles);
	return userModel.create({
		firstName: user.firstName,
		lastName: user.lastName,
		schoolId: user.schoolId,
		email: user.email,
		ldapDn: user.ldapDn,
		ldapId: user.ldapId,
		roles: user.roles,
	});
};

/**
 * request user and compare the email address.
 * if possible it should be solved via unique index on database
 * @param {string} email
 * @param {string} userId
 */
const checkMail = async (email, userId) => {
	if (email) {
		const users = await userModel
			.find({ query: { email: email.toLowerCase() } })
			.lean()
			.exec();
		if (userId && users.length === 1 && equalIds(users[0]._id, userId)) return;
		if (users.length !== 0) {
			throw new BadRequest('Email already exists.');
		}
	}
};

const createUserAndAccount = async (inputUser, inputAccount) => {
	await checkMail(inputUser.email);
	const user = (await createUser(inputUser)).toObject();
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
	await checkMail(changedUser.email, userId);
	const user = await userModel.findOneAndUpdate({ _id: userId }, changedUser, { new: true }).lean().exec();
	const account = await updateAccount(user._id, changedAccount);
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
	private: { createAccount, createUser, updateAccount },
	createUserAndAccount,
	updateUserAndAccount,
	findByLdapIdAndSchool,
};

module.exports = UserRepo;
