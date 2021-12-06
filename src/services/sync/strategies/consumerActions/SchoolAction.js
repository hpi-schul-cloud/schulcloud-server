const { Configuration } = require('@hpi-schul-cloud/commons');
const BaseConsumerAction = require('./BaseConsumerAction');
// TODO: place from where it is importat must be fixed later
const { LDAP_SYNC_ACTIONS } = require('../SyncMessageBuilder');
const { NODE_ENV, ENVIRONMENTS } = require('../../../../../config/globals');
const { SchoolRepo } = require('../../repo');
const { fileStorageTypes } = require('../../../school/model');
const getFileStorageStrategy = require('../../../fileStorage/strategies').createStrategy;
const { BadRequest } = require('../../../../errors');

const FEATURE_LDAP_MIGRATE_ENABED = Configuration.get('FEATURE_LDAP_MIGRATE_ENABED');

const defaultOptions = {
	allowedLogKeys: null,
};

class SchoolAction extends BaseConsumerAction {
	constructor(filterActive = true, options = defaultOptions) {
		super(LDAP_SYNC_ACTIONS.SYNC_SCHOOL, options);
		this.filterActive = filterActive;
	}

	async action(data = {}) {
		const { school: schoolData = {} } = data;
		const school = await SchoolRepo.findSchoolByLdapIdAndSystem(schoolData.ldapSchoolIdentifier, schoolData.systems);
		if (school) {
			if (school.name !== schoolData.name) {
				await SchoolRepo.updateSchoolName(school._id, schoolData.name);
			}
			return;
		}
		/* brb and school number matches: enable ldap migration */
		if (FEATURE_LDAP_MIGRATE_ENABED === true && schoolData.ldapSchoolIdentifier) {
			const officialSchoolNumber = schoolData.ldapSchoolIdentifier;
			// compare school numbers
			const schools = await SchoolRepo.findSchoolByOfficialSchoolNumber(officialSchoolNumber);
			if (schools.length === 1) {
				// set migration mode enabled and add ldap uuid
				await SchoolRepo.enableUserMigrationMode(schools[0]._id, officialSchoolNumber, schoolData.systems[0]);
				return;
			}
			if (schools.length > 1) {
				throw new Error(`found multiple schools with officialSchoolNumber ${officialSchoolNumber}`);
			}
			// length:0 create new school when school number does not match...
		}
		// default: create new school
		schoolData.fileStorageType = this.getDefaultFileStorageType();
		const createdSchool = await SchoolRepo.createSchool(schoolData);
		this.createDefaultStorageOptions({
			schoolId: createdSchool._id,
			fileStorageType: createdSchool.fileStorageType,
		});
	}

	getDefaultFileStorageType() {
		return fileStorageTypes && fileStorageTypes[0];
	}

	createDefaultStorageOptions({ schoolId, fileStorageType }) {
		// create buckets only in production mode
		if (fileStorageType && NODE_ENV === ENVIRONMENTS.PRODUCTION) {
			const fileStorageStrategy = getFileStorageStrategy(fileStorageType);
			fileStorageStrategy.create(schoolId).catch((err) => {
				if (err && err.code !== 'BucketAlreadyOwnedByYou') {
					throw new BadRequest(`Error by creating ${fileStorageType} file storage strategy for school ${schoolId}`, {
						schoolId,
						fileStorageType,
					});
				}
			});
		}
	}
}

module.exports = SchoolAction;
