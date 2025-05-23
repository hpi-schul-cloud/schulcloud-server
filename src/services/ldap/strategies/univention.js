const AbstractLDAPStrategy = require('./interface.js');

/**
 * Univention-specific LDAP functionality
 * @implements {AbstractLDAPStrategy}
 */
class UniventionLDAPStrategy extends AbstractLDAPStrategy {
	/**
	 * @public
	 * @see AbstractLDAPStrategy#getSchools
	 * @returns {Array} Array of Objects containing ldapOu (ldap Organization Path), displayName, officialSchoolNumber
	 * @memberof UniventionLDAPStrategy
	 */
	getSchools() {
		let ignoredSchools = '';
		if (Array.isArray(this.config.providerOptions.ignoreSchools)) {
			this.config.providerOptions.ignoreSchools.forEach((schoolOu) => {
				ignoredSchools += `(!(ou=${schoolOu}))`;
			});
		}
		const options = {
			filter: `(&(univentionObjectType=container/ou)(!(ucsschoolRole=school:ou:no_school))(objectClass=ucsschoolOrganizationalUnit)${ignoredSchools})`,
			scope: 'sub',
			attributes: [],
		};
		const searchString = this.config.rootPath || '';
		return this.app
			.service('ldap')
			.searchCollection(this.config, searchString, options)
			.then((data) =>
				data.map((obj) => ({
					ldapOu: obj.ou,
					officialSchoolNumber: obj.ou,
					displayName: obj.displayName,
				}))
			);
	}

	/**
	 * @public
	 * @see AbstractLDAPStrategy#getUsers
	 * @returns {Array} Array of Objects containing email, firstName, lastName, ldapDn, ldapUUID, ldapUID,
	 * (Array) roles = ['teacher', 'student', 'administrator']
	 * @memberof UniventionLDAPStrategy
	 */
	getUsers(school) {
		const options = {
			filter: 'univentionObjectType=users/user',
			scope: 'sub',
			attributes: ['givenName', 'sn', 'mail', 'dn', 'entryUUID', 'uid', 'objectClass', 'SchulCloudAdmin'],
		};
		const searchString = `cn=users,ou=${school.ldapSchoolIdentifier},${this.config.rootPath}`;
		return this.app
			.service('ldap')
			.searchCollection(this.config, searchString, options)
			.then((data) => {
				const results = [];
				data.forEach((obj) => {
					const roles = [];
					if (obj.SchulCloudAdmin === 'TRUE') {
						roles.push('administrator');
					}
					if (obj.objectClass.includes('ucsschoolTeacher')) {
						roles.push('teacher');
					}
					if (obj.objectClass.includes('ucsschoolStudent')) {
						roles.push('student');
					}

					if (roles.length > 0) {
						results.push({
							email: obj.mail,
							firstName: obj.givenName,
							lastName: obj.sn,
							roles,
							ldapDn: obj.dn,
							ldapUUID: obj.entryUUID,
							ldapUID: obj.uid,
						});
					}
				});
				return results;
			});
	}

	/**
	 * @public
	 * @see AbstractLDAPStrategy#getClasses
	 * @returns {Array} Array of Objects containing className, ldapDn, uniqueMembers
	 * @memberof UniventionLDAPStrategy
	 */
	getClasses(school) {
		const options = {
			filter: `ucsschoolRole=school_class:school:${school.ldapSchoolIdentifier}`,
			scope: 'sub',
			attributes: [],
		};
		const searchString = `cn=klassen,cn=schueler,cn=groups,ou=${school.ldapSchoolIdentifier},${this.config.rootPath}`;
		return this.app
			.service('ldap')
			.searchCollection(this.config, searchString, options)
			.then((data) =>
				data.map((obj) => ({
					className: obj.description,
					ldapDn: obj.dn,
					uniqueMembers: obj.uniqueMember,
				}))
			);
	}

	/**
	 * @public
	 * @see AbstractLDAPStrategy#getExpertsQuery
	 * @returns {LDAPQueryOptions} LDAP query options
	 * @memberof UniventionLDAPStrategy
	 */
	getExpertsQuery() {
		const options = {
			filter: 'ucsschoolRole=staff:school:Experte',
			scope: 'sub',
			attributes: [],
		};
		const searchString = `cn=mitarbeiter,cn=users,ou=Experte,${this.config.rootPath}`;
		return { searchString, options };
	}
}

module.exports = UniventionLDAPStrategy;
