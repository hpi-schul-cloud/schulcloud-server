const LDAP_SYNC_ACTIONS = {
	SYNC_USER: 'syncUser',
	SYNC_SCHOOL: 'syncSchool',
	SYNC_CLASSES: 'syncClasses',
};

class SyncMessageBuilder {
	constructor(syncId, systemId) {
		this.syncId = syncId;
		this.systemId = systemId;
	}

	createSyncMessage(action, data) {
		return {
			syncId: this.syncId,
			action,
			data,
		};
	}

	createSchoolDataMessage(ldapSchool, currentYear, federalState) {
		const data = {
			school: {
				name: ldapSchool.displayName,
				systems: [this.systemId],
				ldapSchoolIdentifier: ldapSchool.ldapOu,
				currentYear,
				federalState,
			},
		};
		return this.createSyncMessage(LDAP_SYNC_ACTIONS.SYNC_SCHOOL, data);
	}

	createUserDataMessage(ldapUser, schoolDn) {
		const { firstName, lastName, email, ldapDn, ldapUUID: ldapId, ldapUID, roles } = ldapUser;
		const data = {
			user: {
				firstName,
				lastName,
				systemId: this.systemId,
				schoolDn,
				email,
				ldapDn,
				ldapId,
				roles,
			},
			account: {
				ldapDn,
				ldapId,
				username: `${schoolDn}/${ldapUID}`.toLowerCase(),
				systemId: this.systemId,
				schoolDn,
				activated: true,
			},
		};
		return this.createSyncMessage(LDAP_SYNC_ACTIONS.SYNC_USER, data);
	}

	createClassDataMessage(classData, school) {
		// if there is only one member, ldapjs doesn't give us an array here
		const { uniqueMembers, className, ldapDn } = classData;
		const { ldapSchoolIdentifier, currentYear } = school;
		const data = {
			class: {
				name: className,
				systemId: this.systemId,
				schoolDn: ldapSchoolIdentifier,
				nameFormat: 'static',
				ldapDN: ldapDn,
				year: currentYear,
				uniqueMembers: Array.isArray(uniqueMembers) ? uniqueMembers : [uniqueMembers],
			},
		};
		return this.createSyncMessage(LDAP_SYNC_ACTIONS.SYNC_CLASSES, data);
	}
}
module.exports = { SyncMessageBuilder, LDAP_SYNC_ACTIONS };
