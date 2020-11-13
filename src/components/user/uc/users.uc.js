const { ObjectId } = require('mongoose').Types;

const { GeneralError, NotFound } = require('../../../errors');
const { userRepo, accountRepo, trashbinRepo } = require('../repo/index');

const getUserData = async (id, app) => {
	const data = {};

	const user = await userRepo.getUser(id, app);
	if (!(user && user._id && !user.deletedAt)) {
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

const createUserTrashbin = async (id, data) => {
	const trashBin = await trashbinRepo.createUserTrashbin(id, data);
	if (!(trashBin && trashBin._id)) {
		throw new GeneralError(`Unable to initiate trashBin`);
	}
	return trashBin;
};

const replaceUserWithTombstone = async (id, app) => {
	const uid = ObjectId();
	await userRepo.replaceUserWithTombstone(
		id,
		{
			firstName: 'DELETED',
			lastName: 'USER',
			email: `${uid}@deleted`,
			deletedAt: new Date(),
		},
		app
	);
	return { success: true };
};

const deleteUserUC = async (id, params) => {
	const { app } = params;

	const data = await getUserData(id, app);

	const trashBin = await createUserTrashbin(id, data);

	await replaceUserWithTombstone(id, app);

	await deleteUserData(id, app);

	return trashBin;
};

module.exports = {
	deleteUserUC,
};
