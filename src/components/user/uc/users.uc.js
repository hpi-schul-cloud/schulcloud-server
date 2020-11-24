const { ObjectId } = require('mongoose').Types;
const { BadRequest, Forbidden } = require('../../../errors');
const { userRepo, accountRepo, trashbinRepo } = require('../repo/index');
const { hasRole } = require('./userRoles.uc');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;

const userHaveSameSchool = async (userId, otherUserId) => {
	if (userId && otherUserId) {
		const { schoolId: currentUserSchoolId } = await userRepo.getUser(otherUserId);
		const { schoolId: requestedUserSchoolId } = await userRepo.getUser(userId);

		return equalIds(currentUserSchoolId, requestedUserSchoolId);
	}
	return false;
};

const getUserRelatedData = async (id) => {
	const user = await userRepo.getUser(id);
	if (user.deletedAt) {
		throw new BadRequest(`User already deleted`);
	}

	const account = await accountRepo.getUserAccount(id);
	return { user, account };
};

const deleteUserRelatedData = async (data) => {
	const { id } = data.user;
	await accountRepo.deleteAccountForUserId(id);
};

const createUserTrashbin = async (id, data) => {
	return trashbinRepo.createUserTrashbin(id, data);
};

const replaceUserWithTombstone = async (id) => {
	const uid = ObjectId();
	await userRepo.replaceUserWithTombstone(id, {
		firstName: 'DELETED',
		lastName: 'USER',
		email: `${uid}@deleted`,
		deletedAt: new Date(),
	});
	return { success: true };
};

const checkPermissions = async (id, roleName, { account }) => {
	const conditionPromises = await Promise.all([userHaveSameSchool(id, account.userId), hasRole(id, roleName)]);
	if (conditionPromises.every((v) => v === true)) {
		return true;
	}
	throw new Forbidden(`You don't have permissions to perform this action`);
};

const deleteUser = async (id, roleName, { account }) => {
	await checkPermissions(id, roleName, { account });

	const userRelatedData = await getUserRelatedData(id);

	const trashBin = await createUserTrashbin(id, userRelatedData);

	await replaceUserWithTombstone(id);

	await deleteUserRelatedData(userRelatedData);

	return trashBin;
};

module.exports = {
	deleteUser,
};
