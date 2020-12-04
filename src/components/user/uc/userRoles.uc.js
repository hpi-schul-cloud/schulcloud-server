const { userRepo } = require('../repo');

const hasRole = async (userId, roleName) => {
	if (!userId || !roleName) return false;

	const roles = await userRepo.getUserRoles(userId);
	return roles.some((role) => role.name === roleName);
};

module.exports = { hasRole };