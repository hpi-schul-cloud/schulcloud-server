const { userRepo } = require('../components/user/repo/index');
const { equal: equalIds } = require('../helper/compare').ObjectId;

const hasSameSchool = async (userId, account, app) => {
	if (userId) {
		const { schoolId: currentUserSchoolId } = await userRepo.getUser(account.userId, app);
		const { schoolId: requestedUserSchoolId } = await userRepo.getUser(userId, app);

		return equalIds(currentUserSchoolId, requestedUserSchoolId);
	}
	return false;
};

module.exports = hasSameSchool;
