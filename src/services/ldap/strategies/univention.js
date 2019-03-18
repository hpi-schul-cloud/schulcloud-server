/* eslint-disable no-buffer-constructor */
// tOdo: enable nobufferconstructor again.
const request = require('request-promise-native');

const AbstractLDAPStrategy = require('./interface.js');

/**
 * Univention-specific LDAP functionality
 * @implements {AbstractLDAPStrategy}
 */
class UniventionLDAPStrategy extends AbstractLDAPStrategy {
	/**
     * @public
     * @see AbstractLDAPStrategy#getSchools
     * @returns {Array} Array of Objects containing ldapOu (ldap Organization Path), displayName
     * @memberof UniventionLDAPStrategy
     */
	getSchools() {
		let ignoredSchools = '';
		this.config.providerOptions.ignoreSchools.forEach((schoolOu) => {
			ignoredSchools += `(!(ou=${schoolOu}))`;
		});
		const options = {
			filter: `(&(univentionObjectType=container/ou)(!(ucsschoolRole=school:ou:no_school))${ignoredSchools})`,
			scope: 'sub',
			attributes: [],
		};
		const searchString = this.config.rootPath;
		return this.app.service('ldap').searchCollection(this.config, searchString, options)
			.then(data => data.map(obj => ({
				ldapOu: obj.ou,
				displayName: obj.displayName,
			})));
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
			attributes: ['givenName', 'sn', 'mailPrimaryAdress', 'mail',
				'dn', 'entryUUID', 'uid', 'objectClass', 'memberOf'],
		};
		const searchString = `cn=users,ou=${school.ldapSchoolIdentifier},${this.config.rootPath}`;
		return this.app.service('ldap').searchCollection(this.config, searchString, options)
			.then(data => data.map((obj) => {
				const roles = [];
				if (obj.objectClass.includes('ucsschoolTeacher')) {
					roles.push('teacher');
				}
				if (obj.objectClass.includes('ucsschoolStudent')) {
					roles.push('student');
				}
				if (obj.objectClass.includes('ucsschoolStaff')) {
					// toDo
				}

				return {
					email: obj.mailPrimaryAddress || obj.mail,
					firstName: obj.givenName,
					lastName: obj.sn,
					roles,
					ldapDn: obj.dn,
					ldapUUID: obj.entryUUID,
					ldapUID: obj.uid,
				};
			}));
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
		const searchString = 'cn=klassen,cn=schueler,cn=groups,'
        + `ou=${school.ldapSchoolIdentifier},${this.config.rootPath}`;
		return this.app.service('ldap').searchCollection(this.config, searchString, options)
			.then(data => data.map((obj) => {
				const splittedName = obj.cn.split('-');
				return {
					className: splittedName[splittedName.length - 1],
					ldapDn: obj.dn,
					uniqueMembers: obj.uniqueMember,
				};
			}));
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

	/**
     * @public
     * @see AbstractLDAPStrategy#addUserToGroup
     * @returns {Promise} resolves with truthy result, or rejects with error
     * @see _updateUserGroups
     * @memberof UniventionLDAPStrategy
     */
	addUserToGroup(user, role, group) {
		group = Object.assign(group, { role: role.name });
		return this.updateUserGroups(user, [group], 'create');
	}

	/**
     * @public
     * @see AbstractLDAPStrategy#removeUserFromGroup
     * @returns {Promise} resolves with truthy result, or rejects with error
     * @see _updateUserGroups
     * @memberof UniventionLDAPStrategy
     */
	removeUserFromGroup(user, role, group) {
		return this.updateUserGroups(user, [group], 'delete');
	}

	/**
     * Generates a virtual file to upload to Univention API
     * @param {String} userUUID the UUID of the user to be altered
     * @param {Array[LDAPGroup]} groups array of LDAP group objects (name, description)
     * @returns {Buffer} Buffer containing JSON-object
     * @memberof UniventionLDAPStrategy
     * @private
     */
	generateGroupFile(userUUID, groups) {
		return new Buffer(JSON.stringify([
			{
				entryUUID: userUUID,
				'nbc-global-groups': groups,
			},
		]));
	}

	/**
     * Generates form data to be used with the Univention API
     * @param {User} user the user object
     * @param {Array[LDAPGroup]} groups array of LDAP group objects (name, description)
     * @param {String} [method='create'] either 'create' (default) or 'remove'
     * @returns {Object} form data object
     * @memberof UniventionLDAPStrategy
     * @private
     */
	generateGroupUpdateFormData(user, groups, method = 'create') {
		return {
			input_file: {
				value: this.generateGroupFile(user.ldapId, groups),
				options: {
					filename: 'groups.json',
					type: 'json',
					contentType: 'application/json',
				},
			},
			school: `/v1/schools/${method}globalgroups/`,
			user_role: 'student',
			dryrun: 'false',
		};
	}

	/**
     * Generate and fire Univention API request to add or remove users from
     * groups
     * @param {User} user the user object
     * @param {Array[LDAPGroup]} groups array of LDAP group objects (name,
     * description)
     * @param {String} [method='create'] either 'create' (default) or 'remove'
     * @returns {Promise} resolves with server response on job creation success
     * or rejects with error otherwise. Note that Promise resolution does not
     * mean the operation was successful. Listen to the events published by
     * `UniventionLDAPStrategy#_scheduleResponseCheck` to check for success or
     * errors.
     * @see _scheduleResponseCheck
     * @memberof UniventionLDAPStrategy
     * @private
     */
	updateUserGroups(user, groups, method = 'create') {
		const options = this.getRequestOptions({
			uri: this.config.importUrl || process.env.NBC_IMPORTURL,
			method: 'POST',
			formData: this.generateGroupUpdateFormData(user, groups, method),
		});
		return request(options).then((response) => {
			this.scheduleResponseCheck(response, 'ldap:update_user_groups');
			return response;
		});
	}

	/**
     * Generate Univention API request options (authentication, headers, etc.)
     * @param {Object} [overrides={}] optional object containing overrides
     * @returns {Object} options to be consumed by API request
     * @memberof UniventionLDAPStrategy
     * @private
     */
	getRequestOptions(overrides = {}) {
		const username = this.config.importUser || process.env.NBC_IMPORTUSER;
		const password = this.config.importUserPassword || process.env.NBC_IMPORTPASSWORD;
		const auth = `Basic ${new Buffer(`${username}:${password}`).toString('base64')}`;
		const REQUEST_TIMEOUT = 8000;

		const options = {
			headers: {
				'content-type': 'multipart/form-data',
				Authorization: auth,
			},
			json: true,
			timeout: REQUEST_TIMEOUT,
		};
		return Object.assign(options, overrides);
	}

	/**
     * Publish an event on the global event bus
     * @param {String} event event name
     * @param {Object} [data={}] optional data to be published
     * @memberof UniventionLDAPStrategy
     * @private
     */
	emitStatus(event, data = {}) {
		this.app.emit(event, data);
	}

	/**
     * Check back on response status given by Univention API
     * @param {Object} response response object of the original request
     * @param {number} [timeout=2000] initial timeout (will increase by factor
     * 4 with every retry)
     * @param {number} [retries=5] optional number of retries if no final status
     * is received
     * @memberof UniventionLDAPStrategy
     * @private
     */
	scheduleResponseCheck(response, action, timeout = 2000, retries = 5) {
		const status = (response.status || '').toLowerCase();
		if (status === 'finished') {
			this.emitStatus(`${action}:success`);
			return;
		}
		const abort = status === 'failure' || status === 'aborted';
		if (retries >= 0 && !abort) {
			setTimeout(() => {
				const options = this.getRequestOptions({
					uri: response.url,
					method: 'GET',
				});
				request(options).then((res) => {
					this.scheduleResponseCheck(res, action, timeout * 4, retries - 1);
				});
			}, timeout);
		} else if (abort) {
			this.emitStatus(`${action}:failed`, {
				response, status, retries, timeout,
			});
		} else {
			this.emitStatus(`${action}:timeout`);
		}
	}

	/**
     * Generates a virtual expert file to upload to Univention API
     * @param {user} user the user object
     * @param {account} account the account object
     * @returns {Buffer} Buffer containing JSON-object
     * @memberof UniventionLDAPStrategy
     * @private
     */
	generateExpertFileData(user, account) {
		return new Buffer(JSON.stringify([
			{
				name: account.username,
				email: account.email,
				firstname: user.firstName,
				lastname: user.lastName,
				record_uid: user._id,
			},
		]));
	}

	/**
     * Generates expert form data to be used with the Univention API
     * @param {User} user the user object
     * @param {Account} account the account object
     * @returns {Object} form data object
     * @memberof UniventionLDAPStrategy
     * @private
     */
	generateUpdateExpertFormData(user, account) {
		return {
			input_file: {
				value: this.generateExpertFileData(user, account),
				options: {
					filename: 'experts.json',
					type: 'json',
					contentType: 'application/json',
				},
			},
			school: '/v1/schools/Experte/',
			user_role: 'staff',
			dryrun: 'false',
		};
	}

	/**
     * @public
     * @see AbstractLDAPStrategy#createExpert
     * @returns {Promise} resolves with truthy result, or rejects with error
     * @memberof UniventionLDAPStrategy
     */
	createExpert(user, account) {
		const options = this.getRequestOptions({
			uri: this.config.importUrl || process.env.NBC_IMPORTURL,
			method: 'POST',
			formData: this.generateUpdateExpertFormData(user, account),
		});
		return request(options).then((response) => {
			this.scheduleResponseCheck(response, 'ldap:create_expert');
			return response;
		});
	}
}

module.exports = UniventionLDAPStrategy;
