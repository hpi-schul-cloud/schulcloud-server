const { Forbidden, BadRequest } = require('../errors');
const { userRepo } = require('../components/user/repo/index');
const { equal: equalIds } = require('../helper/compare').ObjectId;

const restrictToSameSchool = async (id, account, app) => {
	if (id) {
		const { schoolId: currentUserSchoolId } = await userRepo.getUser(account.userId, app);
		const { schoolId: requestedUserSchoolId } = await userRepo.getUser(id, app);

		if (!equalIds(currentUserSchoolId, requestedUserSchoolId)) {
			throw new Forbidden('You have no access.');
		}
		return true;
	}
	throw new BadRequest('The request query should include a valid userId');
};

module.exports = restrictToSameSchool;
