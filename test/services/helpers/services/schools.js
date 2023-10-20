const School = require('../../../../src/services/school/model').schoolModel;

let createdSchoolIds = [];

const create =
	(appPromise) =>
	async ({
		name = `HPI-Testschule-${new Date().getTime()}`,
		address = {},
		fileStorageType,
		systems = [],
		federalState,
		ldapSchoolIdentifier,
		previousExternalId,
		ldapLastSync = undefined,
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
		inUserMigration = undefined,
		source = undefined,
		sourceOptions = undefined,
		enableStudentTeamCreation = undefined,
		permissions = undefined,
		language = 'de',
		timezone = 'Europe/Berlin',
		storageProvider = undefined,
	} = {}) => {
		const app = await appPromise;
		const school = await app.service('schools').create({
			name,
			address,
			fileStorageType,
			systems,
			federalState,
			ldapSchoolIdentifier,
			previousExternalId,
			ldapLastSync,
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
			inUserMigration,
			source,
			sourceOptions,
			enableStudentTeamCreation,
			permissions,
			language,
			timezone,
			storageProvider,
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

module.exports = (app) => {
	return {
		create: create(app),
		cleanup,
		info: createdSchoolIds,
	};
};
