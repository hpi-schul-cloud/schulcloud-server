const { userModel } = require('../../user/model');
const { importUserModel } = require('../model/importUser.schema');
const roleModel = require('../../role/model');
const { schoolModel } = require('../../school/model');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;
const { BadRequest } = require('../../../errors');

const resolveUserRoles = async (roles) =>
	roleModel
		.find({
			name: {
				$in: roles,
			},
		})
		.lean()
		.exec();

const createUserInternal = async (user) => {
	user.roles = await resolveUserRoles(user.roles);
	return userModel.create({
		firstName: user.firstName,
		lastName: user.lastName,
		schoolId: user.schoolId,
		email: user.email,
		ldapDn: user.ldapDn,
		ldapId: user.ldapId,
		roles: user.roles,
		lastSyncedAt: user.lastSyncedAt,
	});
};

const findUsersByEmail = async (email) => userModel.find({ email: email.toLowerCase() }).lean().exec();

const findUserBySchoolAndName = async (schoolId, firstName, lastName) =>
	userModel.find({ schoolId, firstName, lastName }).lean().exec();

const findUsersSchoolById = async (schoolId) => schoolModel.find({ _id: schoolId }).lean().exec();

const checkCreate = async (inputUser, userSchool) => {
	if (!inputUser?.email) {
		throw new BadRequest(`User cannot be created. Email is missing`);
	}
	const users = await findUsersByEmail(inputUser.email);
	if (users.length !== 0) {
		const foundUser = users[0];
		const userExistsInSchool = foundUser.schoolId;
		const schools = await findUsersSchoolById(foundUser.schoolId);
		throw new BadRequest('User cannot be created, because a user with the same email already exists.', {
			userId: foundUser._id,
			ldapId: foundUser.ldapId,
			existsInSchool: userExistsInSchool,
			userSchool: userSchool.name,
			userSchoolId: userSchool._id,
			existsInSchoolName: schools[0]?.name,
		});
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
	const foundUserByMail = users[0];
	if (!equalIds(foundUserByMail._id, userId)) {
		const userExistsInSchool = foundUserByMail.schoolId;
		throw new BadRequest(
			`User cannot be updated. User and email don't match.
		User with the same email already exists in school ${userExistsInSchool}`,
			{
				userId,
				existsInSchool: userExistsInSchool,
				foundUserByMail: foundUserByMail._id,
			}
		);
	}
};

const createUser = async (inputUser, school) => {
	await checkCreate(inputUser, school);
	return createUserInternal(inputUser);
};

const updateUser = async (userId, changedUser) => {
	await checkUpdate(changedUser.email, userId);
	if ('roles' in changedUser) {
		changedUser.roles = await resolveUserRoles(changedUser.roles);
	}
	const user = await userModel.findOneAndUpdate({ _id: userId }, changedUser, { new: true }).lean().exec();
	return user;
};

const deleteUser = async (userId) => {
	await userModel.remove({ _id: userId }).lean().exec();
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

const findByPreviousExternalIdAndSchool = async (previousExternalId, schoolId) =>
	userModel
		.findOne({
			previousExternalId,
			schoolId,
		})
		.lean()
		.exec();

const findByLdapDnsAndSchool = async (ldapDns, schoolId) =>
	userModel
		.find({
			$or: [
				{
					schoolId,
					ldapDn: { $in: ldapDns },
				},
				{
					schoolId,
					previousExternalId: { $in: ldapDns },
				},
			],
		})
		.populate('roles')
		.lean()
		.exec();

const UserRepo = {
	createUser,
	updateUser,
	deleteUser,
	findUserBySchoolAndName,
	findByLdapIdAndSchool,
	findByPreviousExternalIdAndSchool,
	findByLdapDnsAndSchool,
	// import user methods (used in LDAP)
	addClassToImportUsers,
	createOrUpdateImportUser,
	findImportUsersBySchoolAndName,
};

module.exports = UserRepo;
