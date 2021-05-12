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

const findUsersByEmail = async (email) => {
	return userModel.find({ email: email.toLowerCase() }).lean().exec();
};

const checkCreate = async (email) => {
	if (!email) {
		throw new BadRequest(`User cannot be created. Email is missing`);
	}
	const users = await findUsersByEmail(email);
	if (users.length !== 0) {
		const userExistsInSchool = users[0].schoolId;
		throw new BadRequest(
			`User cannot be created. User with the same email already exists in school ${userExistsInSchool}`,
			{ email }
		);
	}
};

const checkUpdate = async (email, userId) => {
	if (!userId) {
		throw new BadRequest(`User cannot be updated. Userid is missing`);
	}
	if (!email) return;
	const users = await findUsersByEmail(email);
	if (users.length === 0) {
		throw new BadRequest(`User cannot be updated. User with this email doesn't exists.`, {
			userId,
			email,
		});
	} else if (!equalIds(users[0]._id, userId)) {
		const userExistsInSchool = users[0].schoolId;
		throw new BadRequest(
			`User cannot be updated. User and email don't match.
		User with the same email already exists in school ${userExistsInSchool}`,
			{
				userId,
				email,
				existsInSchool: userExistsInSchool,
			}
		);
	}
};

const createUserAndAccount = async (inputUser, inputAccount) => {
	await checkCreate(inputUser.email);
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
	await checkUpdate(changedUser.email, userId);
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

const findByLdapDnsAndSchool = async (ldapDns, schoolId) => {
	return userModel
		.find({
			ldapDn: { $in: ldapDns },
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
	findByLdapDnsAndSchool,
};

module.exports = UserRepo;
