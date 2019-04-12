const request = require('request-promise-native');

const AbstractLDAPStrategy = require('./interface.js');

/**
 * General LDAP functionality
 * @implements {AbstractLDAPStrategy}
 */
class GeneralLDAPStrategy extends AbstractLDAPStrategy {
	constructor(app, config) {
		super(app, config);
	}

	/**
     * @public
     * @see AbstractLDAPStrategy#getSchoolsQuery
     * @returns {Array} Array of Objects containing ldapOu (ldap Organization Path), displayName
     * @memberof GeneralLDAPStrategy
     */
	getSchools() {
		return Promise.resolve([{
			displayName: this.config.providerOptions.schoolName,
			ldapOu: this.config.rootPath,
		}]);
	}

	/**
     * @public
     * @see AbstractLDAPStrategy#getUsers
     * @returns {Array} Array of Objects containing email, firstName, lastName, ldapDn, ldapUUID, ldapUID,
     * (Array) roles = ['teacher', 'student', 'administrator']
     * @memberof GeneralLDAPStrategy
     */
	getUsers(school) {
		const {
			userAttributeNameMapping,
			userPathAdditions,
			roleType,
			roleAttributeNameMapping,
		} = this.config.providerOptions;

		const options = {
			filter: 'objectClass=person',
			scope: 'sub',
			attributes: [
				userAttributeNameMapping.givenName,
				userAttributeNameMapping.sn,
				userAttributeNameMapping.dn,
				userAttributeNameMapping.uuid,
				userAttributeNameMapping.uid,
				userAttributeNameMapping.mail,
				(roleType === 'group') ? 'memberOf' : userAttributeNameMapping.role,
			],
		};

		const rawAttributes = [userAttributeNameMapping.uuid];

		const searchString = `${userPathAdditions},${this.config.rootPath}`;
		return this.app.service('ldap').searchCollection(this.config, searchString, options, rawAttributes)
			.then((data) => {
				const results = [];
				data.forEach((obj) => {
					const roles = [];
					if (roleType === 'group') {
						if (!Array.isArray(obj.memberOf)) {
							obj.memberOf = [obj.memberOf];
						}
						if (obj.memberOf.includes(roleAttributeNameMapping.roleStudent)) {
							roles.push('student');
						}
						if (obj.memberOf.includes(roleAttributeNameMapping.roleTeacher)) {
							roles.push('teacher');
						}
						if (obj.memberOf.includes(roleAttributeNameMapping.roleAdmin)) {
							roles.push('administrator');
						}
						if (obj.memberOf.includes(roleAttributeNameMapping.roleNoSc)) {
							return;
						}
					} else {
						if (obj[userAttributeNameMapping.role]
							=== roleAttributeNameMapping.roleStudent) {
							roles.push('student');
						}
						if (obj[userAttributeNameMapping.role]
							=== roleAttributeNameMapping.roleTeacher) {
							roles.push('teacher');
						}
						if (obj[userAttributeNameMapping.role]
							=== roleAttributeNameMapping.roleAdmin) {
							roles.push('administrator');
						}
						if (obj[userAttributeNameMapping.role]
							=== roleAttributeNameMapping.roleNoSc) {
							return;
						}
					}

					if (roles.length === 0) {
						return;
					}

					results.push({
						email: obj[userAttributeNameMapping.mail],
						firstName: obj[userAttributeNameMapping.givenName],
						lastName: obj[userAttributeNameMapping.sn],
						roles,
						ldapDn: obj[userAttributeNameMapping.dn],
						ldapUUID: obj[userAttributeNameMapping.uuid],
						ldapUID: obj[userAttributeNameMapping.uid],
					});
				});
				return results;
			});
	}

	/**
     * @public
     * @see AbstractLDAPStrategy#getClasses
     * @returns {Array} Array of Objects containing className, ldapDn, uniqueMember 
     * @memberof GeneralLDAPStrategy
     */
	getClasses(school) {

		const {
			classAttributeNameMapping,
			classPathAdditions,
		} = this.config.providerOptions;

		if (classPathAdditions !== '') {
			const options = {
				filter: `${classAttributeNameMapping.description}=*`,
				scope: 'sub',
				attributes: [
					classAttributeNameMapping.dn,
					classAttributeNameMapping.description,
					classAttributeNameMapping.uniqueMember,
				],
			};
			const searchString = `${classPathAdditions},${this.config.rootPath}`;
			return this.app.service('ldap').searchCollection(this.config, searchString, options)
				.then((data) => {
					return data.map((obj) => {
						return {
							className: obj[classAttributeNameMapping.description],
							ldapDn: obj[classAttributeNameMapping.dn],
							uniqueMembers: obj[classAttributeNameMapping.uniqueMember],
						};
					});
				});
		}
	}
}

module.exports = GeneralLDAPStrategy;
