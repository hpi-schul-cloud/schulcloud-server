const { userRepo } = require('./repo/index');

const populateUser = async (context) => {
	context.params.user = await userRepo.getUserWithRoles(context.params.account.userId);
};

module.exports = {
	populateUser,
};
