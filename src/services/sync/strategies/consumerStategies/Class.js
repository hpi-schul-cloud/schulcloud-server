const BaseConsumerStrategie = require('./BaseConsumerStrategie');
// TODO: place from where it is importat must be fixed later
const { LDAP_SYNC_ACTIONS } = require('../LDAPSyncer');
const { SchoolRepo, ClassRepo } = require('../../repo');

const defaultOptions = {
	allowedLogKeys: ['class', 'ldapDN', 'systemId', 'schoolDn', 'year'],
	SchoolRepo,
	ClassRepo,
};

class Class extends BaseConsumerStrategie {
	constructor(filterActive = true, options = defaultOptions) {
		super(LDAP_SYNC_ACTIONS.SYNC_SCHOOL, options);
		this.filterActive = filterActive;
	}

	async action(data = {}) {
		const { class: classData = {} } = data;

		const school = await this.SchoolRepo.findSchoolByLdapIdAndSystem(classData.schoolDn, classData.systemId);

		if (school) {
			const existingClass = await this.ClassRepo.findClassByYearAndLdapDn(school.currentYear, classData.ldapDN);
			if (existingClass) {
				if (existingClass.name !== classData.name) {
					await this.ClassRepo.updateClassName(existingClass._id, classData.name);
				}
			} else {
				const newClass = {
					name: classData.name,
					schoolId: school._id,
					nameFormat: 'static',
					ldapDN: classData.ldapDN,
					year: school.currentYear,
				};
				await this.ClassRepo.createClass(newClass);
			}
		}
	}
}

// TODO: should rename in more specific way
module.exports = Class;
