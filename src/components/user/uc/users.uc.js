const { GeneralError } = require('../../../errors');
const { userRepo, accountRepo, trashbinRepo } = require('../repo/index');

const deleteUser = (id, app) => {
	return userRepo.deleteUser(id, app);
};

const replaceUserWithTombstone = async (id, app) => {
	const tombstoneBuilderPromises = [
		userRepo.replaceUserWithTombstone(id, app),
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
	replaceUserWithTombstone,
};
