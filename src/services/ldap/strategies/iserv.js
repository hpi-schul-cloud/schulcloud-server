/* eslint-disable no-buffer-constructor */
// ToDo: enable no-buffer-constructor again
const request = require('request-promise-native');

const AbstractLDAPStrategy = require('./interface.js');

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
     * @memberof iServLDAPStrategy
     */
	getUsers(school) {
		const options = {
			filter: 'objectClass=person',
			scope: 'sub',
			attributes: ['givenName', 'sn', 'dn', 'uuid', 'uid', 'mail', 'objectClass', 'memberOf'],
		};
		const searchString = `ou=users,${this.config.rootPath}`;
		return this.app.service('ldap').searchCollection(this.config, searchString, options)
			.then((data) => {
				const results = [];
				data.forEach((obj) => {
					const roles = [];
					if (!Array.isArray(obj.memberOf)) {
						obj.memberOf = [obj.memberOf];
					}
					if (obj.memberOf.includes(this.config.providerOptions.TeacherMembershipPath)) {
						roles.push('teacher');
					}
					if (obj.memberOf.includes(this.config.providerOptions.AdminMembershipPath)) {
						roles.push('administrator');
					}
					if (roles.length === 0) {
						const ignoredUser = obj.memberOf.some(
							item => this.config.providerOptions.IgnoreMembershipPath.includes(item),
						);
						if (ignoredUser || !obj.mail || !obj.givenName || !obj.sn || !obj.uuid || !obj.uid) {
							return;
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
	getClasses(school) {
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

	/**
     * @public
     * @see AbstractLDAPStrategy#addUserToGroup
     * @returns {Promise} resolves with truthy result, or rejects with error
     * @see _updateUserGroups
     * @memberof iServLDAPStrategy
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
     * @memberof iServLDAPStrategy
     */
	removeUserFromGroup(user, role, group) {
		return this.updateUserGroups(user, [group], 'delete');
	}

	/**
     * Generates a virtual file to upload to Univention API
     * @param {String} userUUID the UUID of the user to be altered
     * @param {Array[LDAPGroup]} groups array of LDAP group objects (name, description)
     * @returns {Buffer} Buffer containing JSON-object
     * @memberof iServLDAPStrategy
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
     * @memberof iServLDAPStrategy
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
     * @memberof iServLDAPStrategy
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
     * @memberof iServLDAPStrategy
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
     * @memberof iServLDAPStrategy
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
     * @memberof iServLDAPStrategy
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
     * @memberof iServLDAPStrategy
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
     * @memberof iServLDAPStrategy
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
     * @memberof iServLDAPStrategy
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

module.exports = iServLDAPStrategy;
