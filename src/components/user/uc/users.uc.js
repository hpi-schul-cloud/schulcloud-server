const { ObjectId } = require('mongoose').Types;
const { BadRequest, Forbidden } = require('../../../errors');
const { userRepo, accountRepo, trashbinRepo } = require('../repo');
const registrationPinUC = require('./registrationPin.uc');
const pseudonymUC = require('../../pseudonym/uc/pseudonym.uc');
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
	if (account) {
		returnArray.push({
			scope: 'account',
			data: account,
		});
	}

	const pseudonyms = await pseudonymUC.getPseudonymsForUser(id);
	if (pseudonyms.length > 0) {
		returnArray.push({
			scope: 'pseudonym',
			data: pseudonyms,
		});
	}

	const registrationPins = await registrationPinUC.getRegistrationPinsForUser(user.email);
	if (registrationPins.length > 0) {
		returnArray.push({
			scope: 'registrationPin',
			data: registrationPins,
		});
	}

	return returnArray;
};

const findDataIdsByScope = (userRelatedData, scope) => {
	const scopeData = userRelatedData.filter((data) => data.scope === scope);
	if (scopeData && scopeData.length === 1) {
		return scopeData[0].data.map((data) => data._id);
	}
	return [];
};

const deleteUserRelatedData = async (id, userRelatedData) => {
	await accountRepo.deleteAccountForUserId(id);
	const pseudonymIds = findDataIdsByScope(userRelatedData, 'pseudonym');
	if (pseudonymIds.length > 0) {
		await pseudonymUC.deletePseudonyms(pseudonymIds);
	}

	const registrationPinIds = findDataIdsByScope(userRelatedData, 'registrationPin');
	if (registrationPinIds.length > 0) {
		await registrationPinUC.deleteRegistrationPins(registrationPinIds);
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

	await deleteUserRelatedData(id, userRelatedData);

	return trashBin;
};

module.exports = {
	deleteUser,
};
