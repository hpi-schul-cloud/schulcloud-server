const { userModel } = require('../../user/model.js');

const findSchool = async (userId) => {
	const user = await userModel.findById(userId).select('schoolId');
	const { schoolId } = user;
	return schoolId || '';
};

module.exports = {
	findSchool,
};
