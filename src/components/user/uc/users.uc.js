const { ObjectId } = require('mongoose').Types;

const { GeneralError } = require('../../../errors');
const { userRepo, accountRepo, trashbinRepo } = require('../repo/index');

const deleteUser = async (id, app) => {
	try {
		// get user
		const user = await userRepo.getUser(id, app);
		// save user to trashbin
		await trashbinRepo.updateUserTrashbin(id, { user });
		// get user
		const account = await accountRepo.getUserAccount(id, app);
		// save account to trashbin
		await trashbinRepo.updateUserTrashbin(id, { account });
		// delete account
		const resultAccDel = await accountRepo.deleteUserAccount(id);
		// replace user by tombstone
		const uid = ObjectId();
		const resultUsrTmb = await userRepo.replaceUserWithTombstoneDR(id, app, {
			firstName: 'DELETED',
			lastName: 'USER',
			email: `${uid}@deleted`,
			deletedAt: new Date(),
		});
		return { success: true };
	} catch (err) {
		if (err.code >= 500) {
			throw new GeneralError(id);
		}
		return { success: false, reason: err };
	}
};

const putUserToTrashbin = async (id, app) => {
	const user = await userRepo.getUser(id, app);
	const trashbinResult = await trashbinRepo.createUserTrashbinMW(user, app);
	return { success: !!trashbinResult.deletedAt };
};

const replaceUserWithTombstone = async (id, app) => {
	const user = await userRepo.getUser(id, app);

	const tombstoneBuilderPromises = [
		userRepo.replaceUserWithTombstoneMW(user, app),
		accountRepo.replaceUserAccountWithTombstone(id, app),
	];
	try {
		const results = await Promise.allSettled(tombstoneBuilderPromises);
		const success = results.every((r) => r.status === 'fulfilled');
		if (!success) {
			const rejectedReasons = results
				.filter((r) => r.status === 'rejected')
				.map((r) => r.reason)
				.join(';');
			return { success: false, reason: rejectedReasons };
		}
		return { success: true };
	} catch (err) {
		if (err.code >= 500) {
			throw new GeneralError(id);
		}
		return { success: false, reason: err };
	}
};

module.exports = {
	deleteUser,
	putUserToTrashbin,
	replaceUserWithTombstone,
};
