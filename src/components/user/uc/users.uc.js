const { ObjectId } = require('mongoose').Types;
const { BadRequest } = require('../../../errors');
const { userRepo, accountRepo, trashbinRepo } = require('../repo/index');
const restrictToSameSchool = require('../../../utils/restrictToSameSchool');
const restrictToRole = require('../../../utils/restrictToRole');

const getUserData = async (id, app) => {
	const user = await userRepo.getUser(id, app);
	if (user.deletedAt) {
		throw new BadRequest(`User already deleted`);
	}
	const account = await accountRepo.getUserAccount(id, app);
	return { user, account };
};

const deleteUserData = async (data, app) => {
	const { id } = data.user;
	await accountRepo.deleteUserAccount(id, app);
};

const createUserTrashbin = async (id, data) => {
	return trashbinRepo.createUserTrashbin(id, data);
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

const deleteUserUC = async (id, roleName, { account, app }) => {
	await restrictToSameSchool(id, account, app);
	await restrictToRole(id, roleName, app);

	const data = await getUserData(id, app);

	const trashBin = await createUserTrashbin(id, data);

	await replaceUserWithTombstone(id, app);

	await deleteUserData(data, app);

	return trashBin;
};

module.exports = {
	deleteUserUC,
};
