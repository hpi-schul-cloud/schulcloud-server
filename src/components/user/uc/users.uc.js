const { ObjectId } = require('mongoose').Types;
const { BadRequest, Forbidden } = require('../../../errors');
const { userRepo, accountRepo, trashbinRepo } = require('../repo/index');
const hasSameSchool = require('../../../utils/hasSameSchool');
const hasRole = require('../../../utils/hasRole');

const getUserRelatedData = async (id, app) => {
	const user = await userRepo.getUser(id, app);
	if (user.deletedAt) {
		throw new BadRequest(`User already deleted`);
	}

	const account = await accountRepo.getUserAccount(id, app);
	return { user, account };
};

const deleteUserRelatedData = async (data, app) => {
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

const checkPermissions = async (id, account, app, roleName) => {
	if ((await hasSameSchool(id, account, app)) && (await hasRole(id, roleName, app))) {
		return true;
	}
	throw new Forbidden(`You don't have permissions to perform this action`);
};

const deleteUser = async (id, roleName, { account, app }) => {
	await checkPermissions(id, account, app, roleName);

	const userRelatedData = await getUserRelatedData(id, app);

	const trashBin = await createUserTrashbin(id, userRelatedData);

	await replaceUserWithTombstone(id, app);

	await deleteUserRelatedData(userRelatedData, app);

	return trashBin;
};

module.exports = {
	deleteUser,
};
