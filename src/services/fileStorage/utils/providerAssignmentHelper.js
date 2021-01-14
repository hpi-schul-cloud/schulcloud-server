const { ObjectId } = require('mongoose').Types;
const { info, warning } = require('../../../logger');
const { schoolModel } = require('../../school/model');

/**
 * Try to find provider for the school. Compare the schoolId with bucket name
 * If found return provider
 * @param bucketsForProvider - map {provider: [buckets]}
 * @param school
 * @returns {string|undefined}
 */
const findProviderForSchool = (bucketsForProvider, school) => {
	for (const [provider, buckets] of Object.entries(bucketsForProvider)) {
		const bucketExists = buckets.indexOf(`bucket-${school.toString()}`) >= 0;
		if (bucketExists) return provider;
	}
	return undefined;
};

/**
 * Update provider for school
 * @param provider
 * @param schoolId
 * @returns {Promise<void>}
 */
const updateProviderForSchool = async (provider, schoolId) => {
	if (provider !== undefined) {
		const result = await schoolModel
			.updateOne(
				{
					_id: ObjectId(schoolId),
				},
				{ $set: { storageProvider: provider } }
			)
			.exec();
		info(`${schoolId} successfully updated for provider ${provider}: ${result}`);
	} else {
		warning(`${schoolId} couldn't be assigned to any provider`);
	}
};

module.exports = {
	findProviderForSchool,
	updateProviderForSchool,
};
