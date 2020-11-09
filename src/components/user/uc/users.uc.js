const { ObjectId } = require('mongoose').Types;

const { GeneralError, NotFound } = require('../../../errors');
const { userRepo, accountRepo, trashbinRepo } = require('../repo/index');

const deleteUser = async (id, app) => {
	try {
		// get user
		const user = await userRepo.getUser(id, app);
		if (!(user && user._id)) {
			throw new NotFound(`User ${id} not found`);
		}

		const trashBin = await trashbinRepo.createUserTrashbinDR(id);
		if (!(trashBin && trashBin._id)) {
			throw new GeneralError(`Unable to initiate trashBin`);
		}

		// save user to trashbin
		await trashbinRepo.updateUserTrashbin(trashBin._id, { user });

		// get account
		const account = await accountRepo.getUserAccount(id, app);

		// save account to trashbin
		await trashbinRepo.updateUserTrashbin(trashBin._id, { account });

		// delete account
		await accountRepo.deleteUserAccount(id);

		// replace user by tombstone
		const uid = ObjectId();
		await userRepo.replaceUserWithTombstoneDR(id, app, {
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
	const tombstoneBuilderPromises = [
		userRepo.replaceUserWithTombstoneDR(id, app),
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
