const AbstractLDAPStrategy = require('./interface.js');
const { filterForModifiedEntities } = require('./deltaSyncUtils');

/**
 * iServ-specific LDAP functionality
 * @implements {AbstractLDAPStrategy}
 */
class iServLDAPStrategy extends AbstractLDAPStrategy {
	/**
	 * @public
	 * @see AbstractLDAPStrategy#getSchools
	 * @returns {Array} Array of Objects containing ldapOu (ldap Organization Path), displayName
	 * @memberof iServLDAPStrategy
	 */
	getSchools() {
		return Promise.resolve([
			{
				displayName: this.config.providerOptions.schoolName,
				ldapOu: this.config.rootPath,
			},
		]);
	}

	/**
	 * @public
	 * @see AbstractLDAPStrategy#getUsers
	 * @returns {Array} Array of Objects containing email, firstName, lastName, ldapDn, ldapUUID, ldapUID,
	 * (Array) roles = ['teacher', 'student', 'administrator']
	 * @memberof iServLDAPStrategy
	 */
	getUsers(school) {
		const options = {
			filter: filterForModifiedEntities(school.ldapLastSync, 'objectClass=person'),
			scope: 'sub',
			attributes: ['givenName', 'sn', 'dn', 'uuid', 'uid', 'mail', 'objectClass', 'memberOf', 'modifyTimestamp'],
		};
		const searchString = `ou=users,${this.config.rootPath}`;
		return this.app
			.service('ldap')
			.searchCollection(this.config, searchString, options)
			.then((data) => {
				const results = [];
				data.forEach((obj) => {
					const roles = [];
					if (!Array.isArray(obj.memberOf)) {
						obj.memberOf = [obj.memberOf];
					}
					if (obj.memberOf.includes(this.config.providerOptions.TeacherMembershipPath)) {
						if (!obj.givenName) {
							obj.givenName = 'Lehrkraft';
						}
						roles.push('teacher');
					}
					if (obj.memberOf.includes(this.config.providerOptions.AdminMembershipPath)) {
						if (!obj.givenName) {
							obj.givenName = 'Admin';
						}
						roles.push('administrator');
					}
					if (roles.length === 0) {
						const ignoredUser = obj.memberOf.some((item) =>
							this.config.providerOptions.IgnoreMembershipPath.includes(item)
						);
						if (ignoredUser || !obj.mail || !obj.sn || !obj.uuid || !obj.uid) {
							return;
						}
						if (!obj.givenName) {
							obj.givenName = 'Schüler:in';
						}
						roles.push('student');
					}

					results.push({
						email: obj.mail,
						firstName: obj.givenName,
						lastName: obj.sn,
						roles,
						ldapDn: obj.dn,
						ldapUUID: obj.uuid,
						ldapUID: obj.uid,
						modifyTimestamp: obj.modifyTimestamp,
					});
				});
				return results;
			});
	}

	/**
	 * @public
	 * @see AbstractLDAPStrategy#getClasses
	 * @returns {Array} Array of Objects containing className, ldapDn, uniqueMembers
	 * @memberof iServLDAPStrategy
	 */
	getClasses() {
		return Promise.resolve([]);
	}

	/**
	 * @public
	 * @see AbstractLDAPStrategy#getExpertsQuery
	 * @returns {LDAPQueryOptions} LDAP query options
	 * @memberof iServLDAPStrategy
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

module.exports = iServLDAPStrategy;
