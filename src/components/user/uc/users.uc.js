const { ObjectId } = require('mongoose').Types;
const { BadRequest, Forbidden } = require('../../../errors');
const { userRepo, accountRepo, trashbinRepo } = require('../repo/index');
const { equal: equalIds } = require('../../../helper/compare').ObjectId;
const { facadeLocator } = require('../../../utils/facadeLocator');
const errorUtils = require('../../../errors/utils');
const { trashBinResult } = require('../../helper/uc.helper');

const getSchoolIdOfUser = async (userId) => {
	const user = await userRepo.getUser(userId);
	return user.schoolId;
};

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

const createUserTrashbin = async (id, data) => trashbinRepo.createUserTrashbin(id, data);

const replaceUserWithTombstone = async (user) => {
	const { _id, schoolId } = user;
	const uid = ObjectId();
	await userRepo.replaceUserWithTombstone(_id, {
		firstName: 'DELETED',
		lastName: 'USER',
		email: `${uid}@deleted`,
		deletedAt: new Date(),
		schoolId,
	});
	await accountRepo.deleteAccountForUserId(_id);
	return { success: true };
};

const isSuperhero = (currentUser) => currentUser.roles.some((role) => role.name === 'superhero');

const checkPermissionsInternal = (affectedUser, roleName, permissionAction, currentUser) => {
	let grantPermission = true;
	// the effected user's role fits the rolename for the route
	grantPermission = grantPermission && affectedUser.roles.some((role) => role.name.toUpperCase() === roleName);
	// users must be on same school
	grantPermission =
		grantPermission && (equalIds(affectedUser.schoolId, currentUser.schoolId) || isSuperhero(currentUser));

	// current user must have the permission
	affectedUser.roles.forEach((userRoleToBeAffected) => {
		if (userRoleToBeAffected.name === 'student') {
			grantPermission =
				grantPermission &&
				currentUser.roles.some((role) =>
					role.permissions.some((permission) => permission === `STUDENT_${permissionAction}`)
				);
		}
		if (userRoleToBeAffected.name === 'teacher') {
			grantPermission =
				grantPermission &&
				currentUser.roles.some((role) =>
					role.permissions.some((permission) => permission === `TEACHER_${permissionAction}`)
				);
		}
		if (userRoleToBeAffected.name === 'administrator') {
			grantPermission = grantPermission && isSuperhero(currentUser);
		}
	});

	if (!grantPermission) {
		throw new Forbidden(`You don't have permissions to perform this action`);
	}
};

/**
 * Checks if the user defined by params.user has the right to perform the action defined in permissionAction on the user defined in id
 *
 * @param {string|string[]} affectedUserId ID or list of IDs of the user(s) to be affected by the request
 * @param {*} roleName the role name that the effected user should have
 * @param {*} permissionAction the action that is to be performed (CREATE, EDIT, DELETE)
 * @param {Object} params needs to contain a property `user` with populated roles and permissions, which is the user issuing the request
 */
const checkPermissions = async (affectedUserId, roleName, permissionAction, { user: currentUser }) => {
	const ids = Array.isArray(affectedUserId) ? affectedUserId : [affectedUserId];
	const affectedUsers = await userRepo.getUsersWithRoles(ids);
	affectedUsers.forEach((aUser) => {
		checkPermissionsInternal(aUser, roleName, permissionAction, currentUser);
	});
};

const getOrCreateTombstoneUserId = async (schoolId, user) => {
	const schoolFacade = facadeLocator.facade('/school/v2');
	const school = await schoolFacade.getSchool(schoolId);
	if (school.tombstoneUserId) {
		return school.tombstoneUserId;
	}
	const tombstoneSchool = await schoolFacade.getTombstoneSchool();
	if (tombstoneSchool) {
		const schoolTombstoneUser = await userRepo.createTombstoneUser(schoolId, tombstoneSchool._id);
		await schoolFacade.setTombstoneUser(user, schoolId, schoolTombstoneUser._id);
		return schoolTombstoneUser;
	}
	return undefined;
};

const deleteUser = async (id, { user: loggedinUser }) => {
	const userAccountData = await getUserData(id);
	const user = userAccountData.find(({ scope }) => scope === 'user').data;

	await createUserTrashbin(id, userAccountData);

	await replaceUserWithTombstone(user);
	try {
		const registrationPinFacade = facadeLocator.facade('/registrationPin/v2');
		await registrationPinFacade.deleteRegistrationPinsByEmail(user.email);
		if (user.parents) {
			await Promise.all(
				user.parents.map((parent) => registrationPinFacade.deleteRegistrationPinsByEmail(parent.email))
			);
		}
	} catch (error) {
		errorUtils.asyncErrorLog(error, `failed to delete registration pin for user ${user._id}`);
	}

	const schoolTombstoneUserId = await getOrCreateTombstoneUserId(user.schoolId, loggedinUser);
	// this is an async function, but we don't need to wait for it, because we don't give any errors information back to the user
	const facades = ['/pseudonym/v2', '/helpdesk/v2', '/fileStorage/v2', '/classes/v2', '/courses/v2', '/messenger/v2'];
	deleteUserRelatedData(user._id, schoolTombstoneUserId, facades).catch((error) => {
		errorUtils.asyncErrorLog(error, 'deleteUserRelatedData failed');
	});
};

module.exports = {
	getSchoolIdOfUser,
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
