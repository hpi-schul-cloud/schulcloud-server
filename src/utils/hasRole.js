const { userRepo } = require('../components/user/repo');

const hasRole = async (id, roleName, app) => {
	if (!id || !roleName) return false;

	const roles = await userRepo.getUserRoles(id, app);
	return roles.some((role) => role.name === roleName);
};

module.exports = hasRole;
