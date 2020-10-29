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
		return { success };
	} catch (err) {
		if (err.code >= 500) {
			throw new GeneralError(id);
		}
		console.log(id, err);
		return { success: false };
	}
};

module.exports = {
	deleteUser,
	replaceUserWithTombstone,
};
