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
		const options = {
			filter: 'objectClass=person',
			scope: 'sub',
			attributes: [
				this.config.providerOptions.userAttributeNameMapping.givenName,
				this.config.providerOptions.userAttributeNameMapping.sn,
				this.config.providerOptions.userAttributeNameMapping.dn,
				this.config.providerOptions.userAttributeNameMapping.uuid,
				this.config.providerOptions.userAttributeNameMapping.uid,
				this.config.providerOptions.userAttributeNameMapping.mail,
				this.config.providerOptions.userAttributeNameMapping.role,
			],
		};
		const searchString = `${this.config.providerOptions.userPathAdditions},${this.config.rootPath}`;
		return this.app.service('ldap').searchCollection(this.config, searchString, options)
			.then((data) => {
				const results = [];
				data.forEach((obj) => {
					const roles = [];
					if (obj[this.config.providerOptions.userAttributeNameMapping.role] === 'ROLE_STUDENT') {
						roles.push('student');
					}
					if (obj[this.config.providerOptions.userAttributeNameMapping.role] === 'ROLE_TEACHER') {
						roles.push('teacher');
					}
					if (obj[this.config.providerOptions.userAttributeNameMapping.role] === 'ROLE_ADMIN') {
						roles.push('administrator');
					}
					if (obj[this.config.providerOptions.userAttributeNameMapping.role] === 'ROLE_NO_SC') {
						return;
					}

					results.push({
						email: obj[this.config.providerOptions.userAttributeNameMapping.mail],
						firstName: obj[this.config.providerOptions.userAttributeNameMapping.givenName],
						lastName: obj[this.config.providerOptions.userAttributeNameMapping.sn],
						roles,
						ldapDn: obj[this.config.providerOptions.userAttributeNameMapping.dn],
						ldapUUID: obj[this.config.providerOptions.userAttributeNameMapping.uuid],
						ldapUID: obj[this.config.providerOptions.userAttributeNameMapping.uid],
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
		const options = {
			filter: `${this.config.providerOptions.classAttributeNameMapping.description}=*`,
			scope: 'sub',
			attributes: [
				this.config.providerOptions.classAttributeNameMapping.dn,
				this.config.providerOptions.classAttributeNameMapping.description,
				this.config.providerOptions.classAttributeNameMapping.uniqueMember,
			],
		};
		const searchString = `${this.config.providerOptions.groupPathAdditions},${this.config.rootPath}`;
		return this.app.service('ldap').searchCollection(this.config, searchString, options)
			.then((data) => {
				return data.map((obj) => {
					return {
						className: obj[this.config.providerOptions.classAttributeNameMapping.description],
						ldapDn: obj[this.config.providerOptions.classAttributeNameMapping.dn],
						uniqueMembers: obj[this.config.providerOptions.classAttributeNameMapping.uniqueMember],
					};
				});
			});
	}
}

module.exports = GeneralLDAPStrategy;
