const accountModel = require('../../account/model');
const { userModel } = require('../../user/model');
const { importUserModel } = require('../model/importUser.schema');
const roleModel = require('../../role/model');
const { schoolModel } = require('../../school/model');
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

const findUsersByEmail = async (email) => userModel.find({ email: email.toLowerCase() }).lean().exec();

const findUserBySchoolAndName = async (schoolId, firstName, lastName) =>
	userModel.find({ schoolId, firstName, lastName }).lean().exec();

const findUsersSchoolById = async (schoolId) =>
	schoolModel.find({id: schoolId,}).lean().exec();

const checkCreate = async (inputUser, userSchool) => {
	if (!inputUser?.email) {
		throw new BadRequest(`User cannot be created. Email is missing`);
	}
	const users = await findUsersByEmail(inputUser.email);
	if (users.length !== 0) {
		const foundUser = users[0];
		const userExistsInSchool = foundUser.schoolId;
		const schools = await findUsersSchoolById(foundUser.schoolId);
		if (schools !== undefined && schools.length !== 0) {
			const foundSchool = schools[0];
			throw new BadRequest(
				`User cannot be created in school ${userSchool.name} (${userSchool._id}). User with the same email already exists in school ${foundSchool.name} ${userExistsInSchool} with ldapId:${foundUser.ldapId}`,
				{ userId: foundUser._id, ldapId: foundUser.ldapId, existsInSchool: userExistsInSchool, userSchool: userSchool.name, userSchoolId: userSchool._id,existsInSchoolName: foundSchool.name,}
			);
		} else {
			throw new BadRequest(
				`User cannot be created in school ${userSchool.name} (${userSchool._id}). User with the same email already exists in school ${userExistsInSchool} with ldapId:${foundUser.ldapId}`,
				{ userId: foundUser._id, ldapId: foundUser.ldapId, existsInSchool: userExistsInSchool, userSchool: userSchool.name, userSchoolId: userSchool._id}
			);
		}
	}
};

const checkUpdate = async (email, userId) => {
	if (!userId) {
		throw new BadRequest(`User cannot be updated. Userid is missing`);
	}
	if (!email) return;
	const users = await findUsersByEmail(email);
	if (users.length === 0) {
		return;
	}
	if (!equalIds(users[0]._id, userId)) {
		const userExistsInSchool = users[0].schoolId;
		throw new BadRequest(
			`User cannot be updated. User and email don't match.
		User with the same email already exists in school ${userExistsInSchool}`,
			{
				userId,
				existsInSchool: userExistsInSchool,
			}
		);
	}
};

const createUserAndAccount = async (inputUser, inputAccount, school) => {
	await checkCreate(inputUser, school);
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
	if ('roles' in changedUser) {
		changedUser.roles = await resolveUserRoles(changedUser.roles);
	}
	const user = await userModel.findOneAndUpdate({ _id: userId }, changedUser, { new: true }).lean().exec();
	const account = await updateAccount(user._id, changedAccount);
	return { user, account };
};

const findImportUsersBySchoolAndName = async (schoolId, firstName, lastName) => {
	const result = await importUserModel.find({ schoolId, firstName, lastName }).lean().exec();
	return result;
};

const createOrUpdateImportUser = async (schoolId, systemId, ldapId, user) => {
	const userToUpdate = { ...user, schoolId, system: systemId, ldapId };
	const persistedUser = await importUserModel
		.findOneAndUpdate({ schoolId, ldapId }, userToUpdate, { upsert: true })
		.lean()
		.exec();
	return persistedUser;
};

const addClassToImportUsers = async (schoolId, className, userLdapDns) => {
	await importUserModel.updateMany(
		{ schoolId, ldapDn: { $in: userLdapDns } },
		{ $addToSet: { classNames: className } }
	);
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

const findByLdapDnsAndSchool = async (ldapDns, schoolId) =>
	userModel
		.find({
			schoolId,
			ldapDn: { $in: ldapDns },
		})
		.populate('roles')
		.lean()
		.exec();

const UserRepo = {
	private: { createAccount, createUser, updateAccount },
	createUserAndAccount,
	updateUserAndAccount,
	findUserBySchoolAndName,
	findByLdapIdAndSchool,
	findByLdapDnsAndSchool,
	// import user methods (used in LDAP)
	addClassToImportUsers,
	createOrUpdateImportUser,
	findImportUsersBySchoolAndName,
};

module.exports = UserRepo;
