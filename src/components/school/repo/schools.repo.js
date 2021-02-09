const { schoolModel } = require('../../../services/school/model');

const { NotFound } = require('../../../errors');

const getStorageProviderForSchool = async (schoolId) => {
	const school = await schoolModel
		.findOne({ _id: schoolId })
		.populate('storageProvider')
		.select(['storageProvider'])
		.lean()
		.exec();

	if (school === null) throw new NotFound('School not found.');

	return school.storageProvider;
};

module.exports = { getStorageProviderForSchool };
