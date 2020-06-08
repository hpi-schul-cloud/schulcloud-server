const School = require('../../../../src/services/school/model').schoolModel;

let createdSchoolIds = [];

const create = (app) => async ({
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
	schoolGroupId,
	documentBaseDirType,
	// eslint-disable-next-line camelcase
	logo_dataUrl,
	purpose = 'test',
	rssFeeds = [],
	features = [],
	customYears = [],
	inMaintenanceSince = undefined,
	source = undefined,
	sourceOptions = undefined,
	enableStudentTeamCreation = undefined,
	permissions = undefined
} = {}) => {
	if (systems && systems.length === 0) {
		const localSystem = (await app.service('systems').find({ query: { type: 'local' }, paginate: false }))[0];
		systems.push(localSystem._id);
	}
	const school = await app.service('schools').create({
		name,
		address,
		fileStorageType,
		systems,
		federalState,
		ldapSchoolIdentifier,
		documentBaseDirType,
		createdAt,
		schoolGroupId,
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
		inMaintenanceSince,
		source,
		sourceOptions,
		enableStudentTeamCreation,
		permissions
	});
	createdSchoolIds.push(school._id);
	return school;
};

const cleanup = () => {
	if (createdSchoolIds.length === 0) {
		return Promise.resolve();
	}
	const ids = createdSchoolIds;
	createdSchoolIds = [];
	return School.deleteMany({ _id: { $in: ids } });
};

module.exports = (app) => ({
	create: create(app),
	cleanup,
	info: createdSchoolIds,
});
