const { ObjectId } = require('mongoose').Types;
const { BadRequest, Forbidden } = require('../../../errors');
const { userRepo, accountRepo, trashbinRepo } = require('../repo/index');
const { hasRole } = require('./userRoles.uc');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;
const errorUtils = require('../../../errors/utils');

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

/**
 *
 * @param {*} userId
 * @param {*} app instance of app to get facades from
 * @param {*} deleteUserFacades e.g. ['/registrationPin/v2', '/fileStorage/v2']
 */
const deleteUserRelatedData = async (userId, app, deleteUserFacades = []) => {
	for (const facadeName of deleteUserFacades) {
		const facade = app.facade(facadeName);
		if (typeof facade.deleteUserData === 'function') {
			try {
				// eslint-disable-next-line no-await-in-loop
				const trash = await facade.deleteUserData(userId);
				// eslint-disable-next-line no-await-in-loop
				await trashbinRepo.updateTrashbinByUserId(userId, trash.data);
			} catch (error) {
				errorUtils.asyncErrorLog(error, `failed to delete user data for facade ${facadeName}`);
			}
		} else if (Array.isArray(facade.deleteUserData)) {
			for (const deleteFn of facade.deleteUserData) {
				try {
					// eslint-disable-next-line no-await-in-loop
					const trash = await deleteFn(userId);
					// eslint-disable-next-line no-await-in-loop
					await trashbinRepo.updateTrashbinByUserId(userId, trash.data);
				} catch (error) {
					errorUtils.asyncErrorLog(error, `failed to delete user data for facade ${facadeName}#${deleteFn.name}`);
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

	await createUserTrashbin(id, userAccountData);

	await replaceUserWithTombstone(id);
	try {
		const registrationPinFacade = app.facade('/registrationPin/v2');
		const registrationPinTrash = await registrationPinFacade.deleteRegistrationPinsByEmail(user.email);
		await trashbinRepo.updateTrashbinByUserId(user.id, registrationPinTrash.data); // TODO unnecessary for PINs?
	} catch (error) {
		errorUtils.asyncErrorLog(error, `failed to delete registration pin for user ${user.id}`);
	}

	// this is an async function, but we don't need to wait for it, because we don't give any errors information back to the user
	deleteUserRelatedData(user.id, app, []).catch((error) => {
		errorUtils.asyncErrorLog(error, 'deleteUserRelatedData failed');
	});
};

module.exports = {
	deleteUser,
	// following not to exported by facade
	checkPermissions,
	createUserTrashbin,
	deleteUserRelatedData,
	getUserData,
	replaceUserWithTombstone,
	userHaveSameSchool,
};
