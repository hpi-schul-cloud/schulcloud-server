const { yearModel: Year } = require('../../../../src/services/school/model');
const yearLogic = require('../../../../src/services/school/logic/year');

let createdYears = [];

// use a not existing year name because year names must be unique
let anyYear = new Date().getFullYear() + 100;
const createName = (increase = true) => {
	if (increase === true) {
		anyYear += 1;
	}
	return `${anyYear}/${String(anyYear + 1).substring(2, 4)}`;
};

const create = async (
	data = {
		name: createName(),
		startDate: yearLogic.getDefaultStartDate(createName(false)),
		endDate: yearLogic.getDefaultEndDate(createName(false)),
	}
) => {
	const year = await Year.create(data);
	createdYears.push(year._id);
	return year;
};

const cleanup = () => {
	if (createdYears.length === 0) {
		return Promise.resolve();
	}
	const ids = createdYears;
	createdYears = [];
	return Year.deleteMany({ _id: { $in: ids } })
		.lean()
		.exec();
};

module.exports = {
	create,
	cleanup,
	info: () => createdYears,
};
