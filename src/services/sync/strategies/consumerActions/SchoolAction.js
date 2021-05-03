const BaseConsumerAction = require('./BaseConsumerAction');
// TODO: place from where it is importat must be fixed later
const { LDAP_SYNC_ACTIONS } = require('../LDAPSyncer');
const { SchoolRepo } = require('../../repo');

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
		} else {
			await SchoolRepo.createSchool(schoolData);
		}
	}
}

module.exports = SchoolAction;
