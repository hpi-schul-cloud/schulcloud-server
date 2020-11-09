const { ObjectId } = require('mongoose').Types;

const { GeneralError, NotFound } = require('../../../errors');
const { userRepo, accountRepo, trashbinRepo } = require('../repo/index');

const replaceUserWithTombstoneUC = async (id, app) => {
	const uid = ObjectId();
	await userRepo.replaceUserWithTombstone(id, app, {
		firstName: 'DELETED',
		lastName: 'USER',
		email: `${uid}@deleted`,
		deletedAt: new Date(),
	});
	return { success: true };
};

const getUserData = async (id, app) => {
	const data = {};

	const user = await userRepo.getUser(id, app);
	if (!(user && user._id)) {
		throw new NotFound(`User ${id} not found`);
	}
	data.user = user;

	const account = await accountRepo.getUserAccount(id, app);
	if (account) {
		data.account = account;
	}
	return data;
};

const deleteUserData = async (id, app) => {
	await accountRepo.deleteUserAccount(id, app);
};

const deleteUserUC = async (id, app) => {
	const data = await getUserData(id, app);

	const trashBin = await trashbinRepo.createUserTrashbin(id, data);
	if (!(trashBin && trashBin._id)) {
		throw new GeneralError(`Unable to initiate trashBin`);
	}

	// replace user by tombstone
	await replaceUserWithTombstoneUC(id, app);

	// delete account
	await deleteUserData(id, app);

	return { success: true };
};

module.exports = {
	deleteUserUC,
	replaceUserWithTombstoneUC,
};
