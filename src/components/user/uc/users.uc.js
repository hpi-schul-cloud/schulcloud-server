const { ObjectId } = require('mongoose').Types;
const { BadRequest, Forbidden } = require('../../../errors');
const { userRepo, accountRepo, trashbinRepo } = require('../repo/index');
const { hasRole } = require('./userRoles.uc');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;
const { asyncErrorLog } = require('../../../errors/utils');

const userHaveSameSchool = async (userId, otherUserId) => {
	if (userId && otherUserId) {
		const { schoolId: currentUserSchoolId } = await userRepo.getUser(otherUserId);
		const { schoolId: requestedUserSchoolId } = await userRepo.getUser(userId);

		return equalIds(currentUserSchoolId, requestedUserSchoolId);
	}
	return false;
};

const getUserData = async (id) => {
	const returnArray = [];
	const user = await userRepo.getUser(id);
	if (user.deletedAt) {
		throw new BadRequest(`User already deleted`);
	}
	returnArray.push({
		scope: 'user',
		data: user,
	});

	const account = await accountRepo.getUserAccount(id);
	returnArray.push({
		scope: 'account',
		data: account,
	});

	return returnArray;
};

const deleteUserRelatedData = async (userId, app) => {
	const deleteUserFacades = [];
	for (const facadeName of deleteUserFacades) {
		const facade = app.facade(facadeName);
		if (typeof facade.deleteUserData === 'function') {
			try {
				const trash = facade.deleteUserData(userId);
				trashbinRepo.updateTrashbinByUserId(userId, trash.data);
			} catch (error) {
				asyncErrorLog(error, `failed to delete user data for facade ${facadeName}`);
			}
		} else if (Array.isArray(facade.deleteUserData)) {
			for (const deleteFn of facade.deleteUserData) {
				try {
					const trash = deleteFn(userId);
					trashbinRepo.updateTrashbinByUserId(userId, trash.data);
				} catch (error) {
					asyncErrorLog(error, `failed to delete user data for facade ${facadeName}#${deleteFn.name}`);
				}
			}
		}
	}
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
	await accountRepo.deleteAccountForUserId(id);
	return { success: true };
};

const checkPermissions = async (id, roleName, { account }) => {
	const conditionPromises = await Promise.all([userHaveSameSchool(id, account.userId), hasRole(id, roleName)]);
	if (conditionPromises.every((v) => v === true)) {
		return true;
	}
	throw new Forbidden(`You don't have permissions to perform this action`);
};

const deleteUser = async (id, roleName, { account, app }) => {
	await checkPermissions(id, roleName, { account });
	// const fileStorage = app.facade('/fileStorage/v2');

	const userAccountData = await getUserData(id);
	const user = userAccountData.find(({ scope }) => scope === 'user').data;

	const trashBin = await createUserTrashbin(id, userAccountData);

	await replaceUserWithTombstone(id);
	try {
		const registrationPinFacade = app.facade('/registrationPin/v2');
		const registrationPinTrash = registrationPinFacade.deleteRegistrationPinsByEmail(user.email);
		trashbinRepo.updateTrashbinByUserId(user.id, registrationPinTrash.data); // TODO unnecessary for PINs?
	} catch (error) {
		asyncErrorLog(error, `failed to delete regeistration pin for user ${user.id}`);
	}

	await deleteUserRelatedData(user.id, app);

	return trashBin;
};

module.exports = {
	deleteUser,
};
