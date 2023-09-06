const BaseConsumerAction = require('./BaseConsumerAction');
// TODO: place from where it is important must be fixed later
const { LDAP_SYNC_ACTIONS } = require('../SyncMessageBuilder');
const { SchoolRepo, ClassRepo, UserRepo } = require('../../repo');
const { NotFound } = require('../../../../errors');
const { SCHOOL_FEATURES } = require('../../../school/model');

const defaultOptions = {
	allowedLogKeys: ['class', 'ldapDN', 'systemId', 'schoolDn', 'year'],
};

// TODO: in all actions it looks not nice that filterActive is not passed as option
// the additional this it not really necessary because options pass all to this.
// but we must also keep in mind that we do not hide options behind BaseConsumerStrategie class.
// But Enable / Disable filter should come from top this is fine.
// If we pass filterActive to options, we must destructure options -> set defaults (that we do not must set repos if we pass this) -> put the combined keys as option to super
// -> i do not like it because we put knowledge and logic handling to the constructor and every they want to add a new action must do it in the same way and implement the same.
// --> sound weird...
class ClassAction extends BaseConsumerAction {
	constructor(filterActive = true, options = defaultOptions) {
		super(LDAP_SYNC_ACTIONS.SYNC_CLASSES, options);
		this.filterActive = filterActive;
	}

	async action(data = {}) {
		const { class: classData = {} } = data;

		let school = await SchoolRepo.findSchoolByLdapIdAndSystem(classData.schoolDn, classData.systemId);

		if (!school) {
			const migratedSchool = await SchoolRepo.findSchoolByPreviousExternalIdAndSystem(
				classData.schoolDn,
				classData.systemId
			);

			if (migratedSchool) {
				if (
					migratedSchool.userLoginMigration &&
					!migratedSchool.userLoginMigration.closedAt &&
					migratedSchool.features?.includes(SCHOOL_FEATURES.ENABLE_LDAP_SYNC_DURING_MIGRATION)
				) {
					school = migratedSchool;
				} else {
					throw new NotFound(
						`Migrated School for schoolDn ${classData.schoolDn} and system ${classData.systemId} couldn't be synced, since the feature is deactivated.`,
						{
							schoolDn: classData.schoolDn,
							systemId: classData.systemId,
						}
					);
				}
			} else {
				throw new NotFound(
					`School for schoolDn ${classData.schoolDn} and system ${classData.systemId} couldn't be found.`,
					{
						schoolDn: classData.schoolDn,
						systemId: classData.systemId,
					}
				);
			}
		}

		if (school.inUserMigration === true) {
			await UserRepo.addClassToImportUsers(school._id, classData.name, classData.uniqueMembers);
			return;
		}

		if (school.inMaintenance) {
			return;
		}

		// default: update classes
		let classId;
		const existingClass = await ClassRepo.findClassByYearAndLdapDn(school.currentYear, classData.ldapDN);
		if (existingClass) {
			classId = existingClass._id;
			if (existingClass.name !== classData.name) {
				await ClassRepo.updateClassName(existingClass._id, classData.name);
			}
		} else {
			const createdClass = await ClassRepo.createClass(classData, school);
			classId = createdClass._id;
		}

		await this.addUsersToClass(school._id, classId, classData.uniqueMembers);
	}

	async addUsersToClass(schoolId, classId, uniqueMembers) {
		const students = [];
		const teachers = [];
		const ldapDns = !Array.isArray(uniqueMembers) ? [uniqueMembers] : uniqueMembers;

		const users = await UserRepo.findByLdapDnsAndSchool(ldapDns, schoolId);

		users.forEach((user) => {
			user.roles.forEach((role) => {
				if (role.name === 'student') students.push(user._id);
				if (role.name === 'teacher') teachers.push(user._id);
			});
		});

		await ClassRepo.updateClassStudents(classId, students);
		await ClassRepo.updateClassTeachers(classId, teachers);
	}
}

module.exports = ClassAction;
