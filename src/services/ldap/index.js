/* eslint-disable no-underscore-dangle */
const ldap = require('ldapjs');
const errors = require('@feathersjs/errors');
const mongoose = require('mongoose');
const hooks = require('./hooks');

const getLDAPStrategy = require('./strategies');

module.exports = function LDAPService() {
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
		}

		/**
		 * @deprecated
		 */
		find(params) {
			// only needed to register as a feathers service
		}

		get(id, params) {
			return app.service('systems').find({ query: { _id: id }, paginate: false })
				.then((system) => {
					if (system[0].ldapConfig.providerOptions.classPathAdditions === '') {
						return this.getUsers(system[0].ldapConfig, '').then((userData) => ({
							users: userData,
							classes: [],
						}));
					}
					return this.getUsers(system[0].ldapConfig, '')
						.then((userData) => this.getClasses(system[0].ldapConfig, '')
							.then((classData) => ({
								users: userData,
								classes: classData,
							})));
				});
		}

		/** Used for activation only */
		async patch(systemId, payload, context) {
			const systemService = await app.service('systems');
			const userService = await app.service('users');
			const schoolsService = await app.service('schools');
			const session = await mongoose.startSession();
			const user = await userService.get(context.account.userId);
			await session.withTransaction(async () => {
				const system = await systemService.get(systemId);
				const school = await schoolsService.get(user.schoolId);
				system.ldapConfig.active = payload.ldapConfig.active;
				school.ldapSchoolIdentifier = system.ldapConfig.rootPath;
				await schoolsService.patch(school);
				await systemService.patch(system);
				return Promise.resolve('success');
			});
			session.endSession();
			return Promise.resolve('success');
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
			const client = this.clients[config.url];
			if (client && client.connected) {
				return Promise.resolve(client);
			}
			return this._connect(config).then((newClient) => {
				this._addClient(config, newClient);
				return Promise.resolve(newClient);
			});
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
				if (!(config && config.url)) {
					reject(new errors.BadRequest('Invalid URL in config object.'));
				}
				//
				const client = ldap.createClient({
					url: config.url,
					reconnect: true
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
		disconnect(config) {
			return this._getClient(config)
				.then((client) => client.unbind((err) => {
					if (err) return Promise.reject(err);
					return Promise.resolve();
				}));
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
						connection.unbind();
						return Promise.resolve(true);
					}
					return Promise.reject(new errors.NotAuthenticated('User could not authenticate'));
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

			return this._getClient(config).then((client) => new Promise((resolve, reject) => {
				const objects = [];
				client.search(searchString, optionsWithPaging, (err, res) => {
					if (err) {
						reject(err);
					}
					res.on('error', reject);
					res.on('searchEntry', (entry) => {
						const result = entry.object;
						rawAttributes.forEach((element) => {
							result[element] = entry.raw[element].toString('base64');
						});
						objects.push(result);
					});
					res.on('end', (result) => {
						if (result.status === 0) {
							resolve(objects);
						}
						reject(new Error('LDAP result code != 0'));
					});
				});
			}));
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
					return Promise.reject(new Error(`Object "${searchString}" not found`));
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
			const { searchString, options } = getLDAPStrategy(app, config).getExpertsQuery();
			return this.searchCollection(config, searchString, options);
		}
	}

	app.use('/ldap', new LdapService());
	const systemService = app.service('/ldap');
	systemService.hooks(hooks);
};
