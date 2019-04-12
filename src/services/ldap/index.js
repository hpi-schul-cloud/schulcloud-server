const ldap = require('ldapjs');
const errors = require('@feathersjs/errors');
const logger = require('winston');
const hooks = require('./hooks');

const getLDAPStrategy = require('./strategies');

module.exports = function() {
	const app = this;

	/**
	 * A service to communicate with LDAP servers.
	 *
	 * This service bundles common methods. Provider-specific functionality is
	 * delegated to strategies implementing a common interface (see
	 * `./strategies/interface.js`).
	 */
	class LdapService {

		constructor() {
			this.clients = {};
			this._registerEventListeners();
		}

		find(params) {

		}

		get(id, params) {
			return app.service('systems').find({ query: { _id: id }, paginate: false })
				.then((system) => {
					if (system[0].ldapConfig.providerOptions.classPathAdditions === '') {
						return this.getUsers(system[0].ldapConfig, '').then((userData) => {
							return {
								users: userData,
								classes: [],
							};
						});
					} else {
						return this.getUsers(system[0].ldapConfig, '').then((userData) => {
							return this.getClasses(system[0].ldapConfig, '').then((classData) => {
								return {
									users: userData,
									classes: classData,
								};
							});
						});
					}
				});
		}

		/**
		 * Add client to the list of clients. There should be only one client
		 * for each config necessary.
		 * @param {ldapConfig} config the ldapConfig
		 * @param {LDAPClient} client the client
		 */
		_addClient(config, client) {
			this.clients[config.url] = client;
		}

		/**
		 * Connect or get a reference to an existing connection
		 * @param {LdapConfig} config the ldapConfig
		 * @return {Promise} resolves with LDAPClient or rejects with error
		 */
		_getClient(config) {
			let client = this.clients[config.url];
			if (client && client.connected) {
				return Promise.resolve(client);
			} else {
				return this._connect(config).then((client) => {
					this._addClient(config, client);
					return Promise.resolve(client);
				});
			}
		}

		/**
		 * Connect to an LDAP server using a search user in the configured root
		 * path
		 * @param {LdapConfig} config the ldapConfig
		 * @param {String} username the search user's username
		 * @param {String} password the search user's password
		 * @return {Promise} resolves with LDAPClient on successful connection,
		 * rejects with error otherwise
		 */
		_connect(config, username, password) {
			username = username || config.searchUser;
			password = password || config.searchUserPassword;

			return new Promise((resolve, reject) => {
				if (! (config && config.url)) {
					reject('Invalid URL in config object.');
				}
				const client = ldap.createClient({
					url: config.url
				});

				client.bind(username, password, (err) => {
					if (err) {
						reject(new errors.NotAuthenticated('Wrong credentials'));
					} else {
						resolve(client);
					}
				});
			});
		}

		/**
		 * Close an established connection to a server identified by an LDAP
		 * config
		 * @param {LdapConfig} config the ldapConfig
		 * @return {Promise} resolves if successfully disconnected, otherwise
		 * rejects with error
		 */
		_disconnect(config) {
			return new Promise((resolve, reject) => {
				if (! (config && config._id)) {
					reject('Invalid config object');
				}
				this._getClient(config).unbind(function(err) {
					if (err) {
						reject(err);
					}
					resolve();
				});
			});
		}

		/**
		 * Authenticate a user via the LDAP server identified by the LDAP config
		 * asociated with the login system
		 * @param {System} system the login system object
		 * @param {String} qualifiedUsername the fully qualified username,
		 * including root path, ou, dn, etc.
		 * @param {String} password the password
		 * @return {Promise} resolves with LDAP user object if successfully
		 * logged in, otherwise rejects with error
		 */
		authenticate(system, qualifiedUsername, password) {
			const config = system.ldapConfig;
			return this._connect(config, qualifiedUsername, password)
				.then((connection) => {
					if (connection.connected) {
						return Promise.resolve(true);
					}
					return Promise.reject('User could not authenticate');
				});
		}

		/**
		 * Returns all LDAP objects matching the given search string and options
		 * @param {LdapConfig} config the ldapConfig
		 * @param {String} searchString the search string
		 * @param {Object} options search options (scope, filter, attributes,
		 * ...), see `http://ldapjs.org/client.html#search` for details
		 * @return {Promise[Array[Object]]} resolves with array of objects
		 * matching the query, rejects with error otherwise
		 */
		searchCollection(config, searchString, options = {}, rawAttributes = []) {
			// Paging to avoid 'max size limit exceeded' issue
			const optionsWithPaging = {
				...options,
				paged: {
					pageSize: 100,
				},
			};

			return this._getClient(config).then((client) => {
				return new Promise((resolve, reject) => {
					const objects = [];
					client.search(searchString, optionsWithPaging, (err, res) => {
						if (err) {
							reject(err);
						}
						res.on('error', reject);
						res.on('searchEntry', (entry) => {
							let result = entry.object;
							rawAttributes.forEach(element => {
								result[element] = entry.raw[element].toString('base64');
							});
							objects.push(result);
						});
						res.on('end', (result) => {
							if (result.status === 0) {
								resolve(objects);
							}
							reject('LDAP result code != 0');
						});
					});
				});
			});
		}

		/**
		 * Returns first LDAP object matching the given search string and options
		 * @see searchCollection
		 * @param {LdapConfig} config the ldapConfig
		 * @param {String} searchString the search string
		 * @param {Object} options search options
		 * @return {Promise[Object]} resolves with object matching the query,
		 * rejects with error otherwise
		 */
		searchObject(config, searchString, options) {
			return this.searchCollection(config, searchString, options)
				.then((objects) => {
					if (objects.length > 0) {
						return Promise.resolve(objects[0]);
					}
					return Promise.reject('Object not found');
				});
		}

		/**
		 * Returns all schools on the LDAP server
		 * @param {LdapConfig} config the ldapConfig
		 * @return {Promise[Array[Object]]} resolves with all school objects or
		 * rejects with error
		 */
		getSchools(config) {
			return getLDAPStrategy(app, config).getSchools();
		}

		/**
		 * Returns all users at a school on the LDAP server
		 * @param {LdapConfig} config the ldapConfig
		 * @param {School} school the school object
		 * @return {Promise[Object]} resolves with all user objects or rejects
		 * with error
		 */
		getUsers(config, school) {
			return getLDAPStrategy(app, config).getUsers(school);
		}

		/**
		 * Returns all classes at a school on the LDAP server
		 * @param {LdapConfig} config the ldapConfig
		 * @param {School} school the school object
		 * @return {Promise[Object]} resolves with all class objects or rejects
		 * with error
		 */
		getClasses(config, school) {
			return getLDAPStrategy(app, config).getClasses(school);
		}

		/**
		 * Returns all experts on the LDAP server
		 * @param {LdapConfig} config the ldapConfig
		 * @return {Promise[Object]} resolves with all expert objects or rejects
		 * with error
		 */
		getExperts(config) {
			const {searchString, options} = getLDAPStrategy(app, config).getExpertsQuery();
			return this.searchCollection(config, searchString, options);
		}

		/**
		 * Generate an LDAP group object from a team
		 * @param {Team} team the team object
		 * @return {LDAPGroup} LDAP group object
		 */
		_teamToGroup(team, role) {
			return {
				name: `schulcloud-${team._id}`,
				description: team.name
			};
		}

		/**
		 * Add a user to a given team
		 * @param {LdapConfig} config the ldapConfig
		 * @param {User} user the user object
		 * @param {Role} role the user's role
		 * @param {Team} team the team object
		 * @return {Promise} resolves with undefined value or rejects with error
		 * @see removeUserFromTeam
		 */
		addUserToTeam(config, user, role, team) {
			let group = this._teamToGroup(team);
			return getLDAPStrategy(app, config).addUserToGroup(user, role, group);
		}

		/**
		 * Remove a user from a given team
		 * @param {LdapConfig} config the ldapConfig
		 * @param {User} user the user object
		 * @param {Role} role the user's role
		 * @param {Team} team the team object
		 * @return {Promise} resolves with undefined value or rejects with error
		 * @see addUserToTeam
		 */
		removeUserFromTeam(config, user, role, team) {
			const group = this._teamToGroup(team);
			return getLDAPStrategy(app, config).removeUserFromGroup(user, role, group);
		}

		/**
		 * Populate an array of user ids with the corresponding user object and
		 * login systems for each id
		 * @param {users} users an array of user ids and team roles
		 * @returns {Promise} resolves with an array of tuples {user, system,
		 * role} of LDAP users, their corresponding login system (contains
		 * ldapConfig), and the team role
		 */
		_populateUsers(users) {
			const userIds = users.map(u => u.userId);
			const roleMap = users.reduce((m, u) => {
				m[u.userId] = u.role;
				return m;
			}, {});
			return app.service('accounts').find({
				query: {
					userId: { $in: userIds },
					$populate: ['systemId', 'userId']
				}
			})
			.then(accounts => {
				// the LDAP service should only attempt to change LDAP users
				return Promise.resolve(accounts.filter(account =>
					account.systemId &&
					account.systemId.type === 'ldap' &&
					account.systemId.ldapConfig
				));
			})
			.then(accounts => {
				return accounts.map(account => {
					return {
						user: account.userId,
						system: account.systemId,
						role: roleMap[account.userId._id]
					};
				});
			});
		}

		/**
		 * Update a given team: call `method` with `ldapConfig`, `user`, and
		 * `team` populated from arguments.
		 * @param {users} [users=[]] an array of user ids and associated roles
		 * @param {Team} team a team object
		 * @param {function(config, user, team)} method a function taking LDAP
		 * config, user object, and team object as arguments
		 * @see addUserToTeam
		 * @see removeUserFromTeam
		 */
		_updateTeam(users=[], team, method) {
			if (users && users.length > 0) {
				this._populateUsers(users)
				.then(pairs => {
					pairs.forEach(({user, system, role}) => {
						method.apply(this, [system.ldapConfig, user, role, team])
							.catch(error => {
								logger.error(error);
							});
					});
				})
				.catch(error => {
					logger.error('LDAP Service: Unable to populate users', error);
				});
			}
		}

		/**
		 * React to event published by the Team service when users are added or
		 * removed to a team.
		 * @param {Object} context event context given by the Team service
		 */
		_onTeamUsersChanged(context) {
			const team = ((context || {}).additionalInfosTeam || {}).team;
			const changes = ((context || {}).additionalInfosTeam || {}).changes;
			if (changes) {
				this._updateTeam(changes.add, team, this.addUserToTeam);
				this._updateTeam(changes.remove, team, this.removeUserFromTeam);
			}
		}

		/**
		 * Register methods of the service to listen to events of other services
		 * @listens teams:after:usersChanged
		 */
		_registerEventListeners() {
			app.on('teams:after:usersChanged', this._onTeamUsersChanged.bind(this));
		}

	}

	app.use('/ldap', new LdapService());

	// Get our initialize service to that we can bind hooks
	const systemService = app.service('/ldap');

	// Set up our before hooks
	systemService.before(hooks.before);

	// Set up our after hooks
	systemService.after(hooks.after);
};
