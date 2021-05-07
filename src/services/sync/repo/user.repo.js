const accountModel = require('../../account/model');
const { userModel } = require('../../user/model');
const roleModel = require('../../role/model');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;
const { BadRequest } = require('../../../errors');

const createAccount = async (account) =>
	accountModel.create({
		userId: account.userId,
		username: account.username.toLowerCase(),
		systemId: account.systemId,
		activated: true,
	});

const resolveUserRoles = async (roles) =>
	roleModel
		.find({
			name: {
				$in: roles,
			},
		})
		.lean()
		.exec();

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
		const users = await userModel.find({ email: email.toLowerCase() }).lean().exec();
		if (userId && users.length === 1 && equalIds(users[0]._id, userId)) return true;
		if (users.length !== 0) {
			return false;
		}
	}
	return true;
};

const createUserAndAccount = async (inputUser, inputAccount) => {
	const canBeCreated = await checkMail(inputUser.email);
	if (!canBeCreated) {
		throw new BadRequest(`User cannot be created. User with the same email already exists.`, inputUser.ldapId);
	}
	const user = (await createUser(inputUser)).toObject();
	inputAccount.userId = user._id;
	const account = (await createAccount(inputAccount)).toObject();
	return { user, account };
};

const updateAccount = async (userId, account) =>
	accountModel
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

const updateUserAndAccount = async (userId, changedUser, changedAccount) => {
	await checkMail(changedUser.email, userId);

	const canBeUpdated = await checkMail(changedUser.email, userId);
	if (!canBeUpdated) {
		throw new BadRequest(`User ${userId} cannot be updated. User with the same email already exists.`, userId);
	}
	changedUser.roles = await resolveUserRoles(changedUser.roles);

	const user = await userModel.findOneAndUpdate({ _id: userId }, changedUser, { new: true }).lean().exec();
	const account = await updateAccount(user._id, changedAccount);
	return { user, account };
};

const findByLdapIdAndSchool = async (ldapId, schoolId) =>
	userModel
		.findOne({
			ldapId,
			schoolId,
		})
		.populate('roles')
		.lean()
		.exec();

const UserRepo = {
	private: { createAccount, createUser, updateAccount },
	createUserAndAccount,
	updateUserAndAccount,
	findByLdapIdAndSchool,
};

module.exports = UserRepo;
