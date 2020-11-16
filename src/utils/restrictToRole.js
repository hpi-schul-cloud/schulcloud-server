const { Forbidden, BadRequest } = require('../errors');
const { userRepo } = require('../components/user/repo/index');

const restrictToRole = async (id, roleName, app) => {
	if (!id) {
		throw new BadRequest('The request query should include a valid userId');
	}
	if (!roleName) {
		throw new BadRequest('The request query should include a valid roleName');
	}

	const roles = await userRepo.getUserRoles(id, app);

	if (roles.some((role) => role.name === roleName)) {
		return true;
	}
	throw new Forbidden('You have no access.');
};

module.exports = restrictToRole;
