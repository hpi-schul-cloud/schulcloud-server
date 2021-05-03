const BaseConsumerAction = require('./BaseConsumerAction');
// TODO: place from where it is importat must be fixed later
const { LDAP_SYNC_ACTIONS } = require('../LDAPSyncer');
const { SchoolRepo, ClassRepo } = require('../../repo');

const defaultOptions = {
	allowedLogKeys: ['class', 'ldapDN', 'systemId', 'schoolDn', 'year'],
};

// TODO: in all actions it looks not nice that filterActive is not passed as option
// the additional this it not really nessasry because options pass all to this.
// but we must also keep in mind that we do not hide options behind BaseConsumerStrategie class.
// But Enable / Disable filter should come from top this is fine.
// If we pass filterActive to options, we must destructure options -> set defaults (that we do not must set repos if we pass this) -> put the combind keys as optiosn to super
// -> i do not like it because we put knowlege and logic handling to the constructor and every they want to add a new action must do it in the same way and implement the same.
// --> sound weird...
class ClassAction extends BaseConsumerAction {
	constructor(filterActive = true, options = defaultOptions) {
		super(LDAP_SYNC_ACTIONS.SYNC_CLASSES, options);
		this.filterActive = filterActive;
	}

	async action(data = {}) {
		const { class: classData = {} } = data;

		const school = await SchoolRepo.findSchoolByLdapIdAndSystem(classData.schoolDn, classData.systemId);

		if (school) {
			const existingClass = await ClassRepo.findClassByYearAndLdapDn(school.currentYear, classData.ldapDN);
			if (existingClass) {
				if (existingClass.name !== classData.name) {
					await ClassRepo.updateClassName(existingClass._id, classData.name);
				}
			} else {
				const newClass = {
					name: classData.name,
					schoolId: school._id,
					nameFormat: 'static',
					ldapDN: classData.ldapDN,
					year: school.currentYear,
				};
				await ClassRepo.createClass(newClass);
			}
		}
	}
}

module.exports = ClassAction;
