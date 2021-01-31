const { schoolGroupModel } = require('../../../../src/services/school/schools.model');

let createdSchoolGroups = [];

const create = async (data) => {
	const schoolGroup = await schoolGroupModel.create(data);
	createdSchoolGroups.push(schoolGroup._id);
	return schoolGroup;
};

const cleanup = async () => {
	if (createdSchoolGroups.length === 0) {
		return Promise.resolve();
	}
	const ids = createdSchoolGroups;
	createdSchoolGroups = [];
	return schoolGroupModel.deleteMany({ _id: { $in: ids } });
};

module.exports = {
	create,
	cleanup,
	info: () => createdSchoolGroups,
};
