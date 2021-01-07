const { userRepo } = require('./repo/index');

// This should be moved to the application context once it is designed and implemented
const populateUser = async (context) => {
	context.params.user = await userRepo.getUserWithRoles(context.params.account.userId);
};

module.exports = {
	populateUser,
};
