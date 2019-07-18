const { yearModel: Year } = require('../../../../src/services/school/model');
const yearLogic = require('../../../../src/services/school/logic/year');

let createdYears = [];

let anyYear = new Date().getFullYear() + 100;
const createName = ((doNotIncrease) => {
	if (!doNotIncrease) {
		anyYear += 1;
	}
	return `${anyYear}/${String(anyYear + 1).substring(2, 4)}`;
});

const create = async (data = {
	name: createName(),
	startDate: yearLogic.getDefaultStartDate(createName(false)),
	endDate: yearLogic.getDefaultEndDate(createName(false)),
}) => {
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
