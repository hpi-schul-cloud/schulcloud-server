const { schoolGroupModel } = require('../../../../src/services/school/model');

let createdSchoolGroups = [];

const create = async (data) => {
	const schoolGroup = await schoolGroupModel.create(data);
	createdSchoolGroups.push(schoolGroup._id);
	return schoolGroup;
};

const cleanup = async () => {
	await schoolGroupModel.deleteMany({ id: { $in: createdSchoolGroups } });
	createdSchoolGroups = [];
};

module.exports = {
	create,
	cleanup,
	info: () => createdSchoolGroups,
};
