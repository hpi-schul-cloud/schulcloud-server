const { BadRequest } = require('../../../errors');
const { ObjectId } = require('../../../helper/compare');

const detectCycle = async (currentRole, originalRoleId, app) => {
	if (ObjectId.equal(currentRole.id, originalRoleId)) {
		return true;
	}
	if (!currentRole.roles || currentRole.roles.length === 0) {
		return false;
	}
	const subroles = await Promise.all(currentRole.roles.map((roleId) => app.service('/roles').get(roleId)));
	const recursiveResults = await Promise.all(subroles.map((role) => detectCycle(role, originalRoleId, app)));
	return recursiveResults.some((r) => r);
};

const preventCycle = async (context) => {
	if (context.data.roles && context.data.roles.length > 0) {
		const subroles = await Promise.all(context.data.roles.map((roleId) => context.app.service('/roles').get(roleId)));
		const recursiveResults = await Promise.all(subroles.map((role) => detectCycle(role, context.id, context.app)));
		const cycleDetected = recursiveResults.some((r) => r);

		if (cycleDetected) {
			throw new BadRequest('the requested rolechange causes a cycle');
		}
	}
	return context;
};

module.exports = { preventCycle };
