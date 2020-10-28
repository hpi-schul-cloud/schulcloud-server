const { userRepo, trashbinRepo } = require('../repo/index');

const deleteUser = (id, app) => {
	// implement stuff
	return { success: true };
};

const replaceUserWithTombstone = (id, app) => {
	return {};
};

module.exports = {
	deleteUser,
	replaceUserWithTombstone,
};
