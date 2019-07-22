const School = require('../../../../src/services/school/model').schoolModel;

let createdSchoolIds = [];

const create = app => async ({
	name = `HPI-Testschule-${new Date().getTime()}`,
	address = {},
	fileStorageType,
	systems = [],
	federalState,
	ldapSchoolIdentifier,
	createdAt = Date.now(),
	updatedAt = Date.now(),
	experimental = false,
	pilot = false,
	currentYear,
	// eslint-disable-next-line camelcase
	logo_dataUrl,
	purpose = 'test',
	rssFeeds = [],
	features = [],
	customYears = [],
} = {}) => {
	if (systems && systems.length === 0) {
		const localSystem = (await app.service('systems').find({ query: { type: 'local' }, paginate: false }))[0];
		systems.push(localSystem._id);
	}
	const school = await School.create({
		name,
		address,
		fileStorageType,
		systems,
		federalState,
		ldapSchoolIdentifier,
		createdAt,
		customYears,
		updatedAt,
		experimental,
		pilot,
		currentYear,
		// eslint-disable-next-line camelcase
		logo_dataUrl,
		purpose,
		rssFeeds,
		features,
	});
	createdSchoolIds.push(school._id);
	return school;
};

const cleanup = async () => {
	await School.deleteMany({ _id: { $in: createdSchoolIds } });
	createdSchoolIds = [];
};

module.exports = app => ({
	create: create(app),
	cleanup,
	info: createdSchoolIds,
});
