const { yearModel: Year } = require('../../../../src/services/school/model');

let createdYears = [];

const create = async (data = { name: Date.now().toString() }) => {
	const year = await Year.create(data);
	createdYears.push(year._id);
	return year;
};

const cleanup = async () => {
	await Year.deleteMany({ _id: { $in: createdYears } });
	createdYears = [];
};

module.exports = {
	create,
	cleanup,
	info: () => createdYears,
};
