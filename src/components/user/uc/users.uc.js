const { ObjectId } = require('mongoose').Types;
const { BadRequest, Forbidden } = require('../../../errors');
const { userRepo, accountRepo, trashbinRepo } = require('../repo/index');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;
const { facadeLocator } = require('../../../utils/facadeLocator');
const errorUtils = require('../../../errors/utils');
const { trashBinResult } = require('../../helper/uc.helper');

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
 * @param schoolTombstoneUserId
 * @param {*} deleteUserFacades e.g. ['/registrationPin/v2', '/fileStorage/v2']
 */
const deleteUserRelatedData = async (userId, schoolTombstoneUserId, deleteUserFacades = []) => {
	for (const facadeName of deleteUserFacades) {
		const facade = facadeLocator.facade(facadeName);
		for (const deleteFn of facade.deleteUserData) {
			try {
				// eslint-disable-next-line no-await-in-loop
				const trash = await deleteFn(userId, schoolTombstoneUserId);
				// eslint-disable-next-line no-await-in-loop
				await trashbinRepo.updateTrashbinByUserId(userId, trash.trashBinData);
			} catch (error) {
				const errorTrashbinResult = trashBinResult({
					scope: 'error',
					data: { error, facade: facadeName, deleteFn: deleteFn.name },
				});
				// eslint-disable-next-line no-await-in-loop
				await trashbinRepo.updateTrashbinByUserId(userId, errorTrashbinResult);
				errorUtils.asyncErrorLog(error, `failed to delete user data for facade ${facadeName}#${deleteFn.name}`);
			}
		}
	}
};

const createUserTrashbin = async (id, data) => {
	return trashbinRepo.createUserTrashbin(id, data);
};

const replaceUserWithTombstone = async (id, schoolId) => {
	const uid = ObjectId();
	await userRepo.replaceUserWithTombstone(id, {
		firstName: 'DELETED',
		lastName: 'USER',
		email: `${uid}@deleted`,
		deletedAt: new Date(),
		schoolId,
	});
	await accountRepo.deleteAccountForUserId(id);
	return { success: true };
};

/**
 * Checks if the user defined by param3.account.userId has the right to perform the action defined in permissionAction on the user defined in id
 *
 * @param {*} id ID of the user to be effected by the request
 * @param {*} roleName the role name that the effected user should have
 * @param {*} permissionAction the action that is to be performed (CREATE, EDIT, DELETE)
 * @param {*} param3 needs to contain account.userId, which is the ID of the user issuing the request
 */
const checkPermissions = async (id, roleName, permissionAction, { user: currentUser }) => {
	const userToBeEffected = await userRepo.getUserWithRoles(id);

	let grantPermission = true;
	// the effected user's role fits the rolename for the route
	grantPermission = grantPermission && userToBeEffected.roles.some((role) => role.name.toUpperCase() === roleName);
	// users must be on same school
	grantPermission = grantPermission && equalIds(userToBeEffected.schoolId, currentUser.schoolId);

	// current user must have the permission
	userToBeEffected.roles.forEach((userRoleToBeEffected) => {
		if (userRoleToBeEffected.name === 'student') {
			grantPermission =
				grantPermission &&
				currentUser.roles.some((role) =>
					role.permissions.some((permission) => permission === `STUDENT_${permissionAction}`)
				);
		}
		if (userRoleToBeEffected.name === 'teacher') {
			grantPermission =
				grantPermission &&
				currentUser.roles.some((role) =>
					role.permissions.some((permission) => permission === `TEACHER_${permissionAction}`)
				);
		}
		if (userRoleToBeEffected.name === 'administrator') {
			grantPermission = grantPermission && currentUser.roles.some((role) => role.name === 'superhero');
		}
	});

	if (!grantPermission) {
		throw new Forbidden(`You don't have permissions to perform this action`);
	}
};

const getOrCreateTombstoneUserId = async (schoolId, user, tombstoneSchoolId) => {
	const schoolFacade = facadeLocator.facade('/school/v2');

	const school = await schoolFacade.getSchool(schoolId);
	if (school.tombstoneUserId) {
		return school.tombstoneUserId;
	}
	const schoolTombstoneUser = await userRepo.createTombstoneUser(schoolId, tombstoneSchoolId);
	await schoolFacade.setTombstoneUser(user, schoolId, schoolTombstoneUser._id);
	return schoolTombstoneUser;
};

const deleteUser = async (id, { user: loggedinUser }) => {
	const schoolFacade = facadeLocator.facade('/school/v2');

	const userAccountData = await getUserData(id);
	const user = userAccountData.find(({ scope }) => scope === 'user').data;
	const tombstoneSchool = await schoolFacade.getTombstoneSchool();

	await createUserTrashbin(id, userAccountData);

	await replaceUserWithTombstone(id, tombstoneSchool._id);
	try {
		const registrationPinFacade = facadeLocator.facade('/registrationPin/v2');
		await registrationPinFacade.deleteRegistrationPinsByEmail(user.email);
	} catch (error) {
		errorUtils.asyncErrorLog(error, `failed to delete registration pin for user ${user._id}`);
	}

	const schoolTombstoneUserId = await getOrCreateTombstoneUserId(user.schoolId, loggedinUser, tombstoneSchool._id);
	// this is an async function, but we don't need to wait for it, because we don't give any errors information back to the user
	const facades = ['/pseudonym/v2', '/helpdesk/v2', '/fileStorage/v2', '/classes/v2', '/courses/v2'];
	deleteUserRelatedData(user._id, schoolTombstoneUserId, facades).catch((error) => {
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
	getOrCreateTombstoneUserId,
};
