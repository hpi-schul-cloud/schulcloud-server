/**
 * @typedef {Object} LDAPGroup
 * @property {String} name the group name
 * @property {String} description the group description
 */

/**
 * @typedef {Object} LDAPQueryOptions
 * @property {String} searchString the search string
 * @property {Object} options the ldapjs options object
 */

/**
 * Class representing provider-specific LDAP-related operations
 * @interface
 * @abstract
 */
class AbstractLDAPStrategy {
	/**
	 * @abstract
	 * @param {App} app
	 * @param {LDAPConfig} config
	 */
	constructor(app, config) {
		if (new.target === AbstractLDAPStrategy) {
			throw new TypeError(`Cannot construct AbstractLDAPStrategy
                instances directly.`);
		}

		this.app = app;
		this.config = config;
	}

	/**
	 * get provider-specific search string and options to find all schools in
	 * the LDAP directory
	 * @abstract
	 * @returns {Array} Array of Objects containing ldapOu (ldap Organization Path), displayName
	 */
	getSchools() {
		throw new TypeError('Method has to be implemented.');
	}

	/* eslint-disable no-unused-vars */

	/**
	 * get provider-specific search string and options to find all users in
	 * a given school in the LDAP directory
	 * @abstract
	 * @param {School} school the school
	 * @returns {Array} Array of Objects containing email, firstName, lastName, ldapDn, ldapUUID, ldapUID,
	 * (Array) roles = ['teacher', 'student', 'administrator']
	 */
	getUsers(school) {
		throw new TypeError('Method has to be implemented.');
	}

	/**
	 * get provider-specific search string and options to find all classes in
	 * a given school in the LDAP directory
	 * @abstract
	 * @param {School} school the school
	 * @returns {Array} Array of Objects containing className, ldapDn, uniqueMember
	 */
	getClasses(school) {
		throw new TypeError('Method has to be implemented.');
	}

	/**
	 * get provider-specific search string and options to find all experts in
	 * the LDAP directory
	 * @abstract
	 * @returns {LDAPQueryOptions} Object containing `searchString` and `options`
	 */
	getExpertsQuery() {
		throw new TypeError('Method has to be implemented.');
	}

	/**
	 * Verify that the connection information is correct
	 * Works like @see AbstractLDAPStrategy#getUsers , but returns only a subset of the users
	 *
	 * @abstract
	 * @param {boolean} verifyFullSync if true all users will be loaded for verification, otherwise only the first 100 records
	 * @returns {Array} Array of Objects containing email, firstName, lastName, ldapDn, ldapUUID, ldapUID,
	 * (Array) roles = ['teacher', 'student', 'administrator']
	 */
	verifyConfig(verifyFullSync) {
		throw new TypeError('Method has to be implemented.');
	}

	/* eslint-enable no-unused-vars */
}

module.exports = AbstractLDAPStrategy;
