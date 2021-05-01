const BaseConsumerStrategie = require('./BaseConsumerStrategie');
// TODO: place from where it is importat must be fixed later
const { LDAP_SYNC_ACTIONS } = require('../LDAPSyncer');
const { SchoolRepo } = require('../../repo');

const defaultOptions = {
	allowedLogKeys: null,
	SchoolRepo,
};

class School extends BaseConsumerStrategie {
	constructor(filterActive = true, options = defaultOptions) {
		super(LDAP_SYNC_ACTIONS.SYNC_SCHOOL, options);
		this.filterActive = filterActive;
	}

	async action(data = {}) {
		const { school: schoolData = {} } = data;
		const school = await this.SchoolRepo.findSchoolByLdapIdAndSystem(
			schoolData.ldapSchoolIdentifier,
			schoolData.systems
		);

		if (school) {
			if (school.name !== schoolData.name) {
				await this.SchoolRepo.updateSchoolName(school._id, schoolData.name);
			}
		} else {
			await this.SchoolRepo.createSchool(schoolData);
		}
	}
}

// TODO: School should rename in more specific way
module.exports = School;
