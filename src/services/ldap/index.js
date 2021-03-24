/* eslint-disable max-classes-per-file */
/* eslint-disable no-underscore-dangle */
const ldap = require('ldapjs');
const mongoose = require('mongoose');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const { Forbidden, NotFound, BadRequest, NotAuthenticated, NoClientInstanceError } = require('../../errors');
const LDAPConnectionError = require('./LDAPConnectionError');

const hooks = require('./hooks');

const getLDAPStrategy = require('./strategies');
const logger = require('../../logger');

class Lock {
	constructor() {
		this.locked = false;
		this.queue = [];
	}

	createDeferredPromise() {
		const deferred = {
			promise: null,
			resolve: null,
			reject: null,
		};

		deferred.promise = new Promise((resolve, reject) => {
			deferred.resolve = resolve;
			deferred.reject = reject;
		});

		return deferred;
	}

	getLock() {
		if (!this.locked) {
			this.locked = true;
			return Promise.resolve;
		}
		const { resolve, promise: deferredPromise } = this.createDeferredPromise();
		this.queue.push({
			resolve,
		});
		return deferredPromise;
	}

	releaseLock() {
		if (this.queue.length === 0) {
			this.locked = false;
		}
		if (this.queue.length > 0) {
			this.queue.shift().resolve();
		}
	}
}

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
			this.mapOfLocks = {};
		}

		/**
		 * @deprecated
		 */
		find(params) {
			// only needed to register as a feathers service
		}

		/**
		 * @deprecated
		 */
		get(id, params) {
			return app
				.service('systems')
				.find({ query: { _id: id, type: 'ldap' }, paginate: false })
				.then(([system]) => {
					if (!system) {
						throw new NotFound();
					}
					if (system.ldapConfig.provider !== 'general') {
						throw new Forbidden('You are not allowed to access this provider.');
					}
					if (system.ldapConfig.providerOptions.classPathAdditions === '') {
						return this.getUsers(system.ldapConfig, '').then((userData) => ({
							users: userData,
							classes: [],
						}));
					}
					return this.getUsers(system.ldapConfig, '').then((userData) =>
						this.getClasses(system.ldapConfig, '').then((classData) => ({
							users: userData,
							classes: classData,
						}))
					);
				});
		}

		/**
		 * Used for activation only
		 * @deprecated
		 */
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
				await schoolsService.patch(school._id, school);
				await systemService.patch(system._id, system);
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
		 * @param {Boolean} [autoconect=true] automatically connect to the server if the connection
		 * is not established yet? Default: `true`
		 * @return {Promise} resolves with LDAPClient or rejects with error
		 */
		async _getClient(config, autoconnect = true) {
			const getNewClient = async () => {
				const newClient = await this._connect(config);
				this._addClient(config, newClient);
				return newClient;
			};

			let client = this.clients[config.url];
			if (autoconnect && (!client || !client.connected)) {
				client = getNewClient();
			}

			if (client) {
				if (!this.mapOfLocks[config.url]) {
					this.mapOfLocks[config.url] = new Lock();
				}
				await this.mapOfLocks[config.url].getLock();
				return client;
			}
			throw new NoClientInstanceError('No client exists and autoconnect is not enabled.');
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
			return new Promise((resolve, reject) => {
				if (!(config && config.url)) {
					reject(new BadRequest('Invalid URL in config object.'));
				}
				logger.debug(`[LDAP] Connecting to "${config.url}"`);
				const client = ldap.createClient({
					url: config.url,
					reconnect: {
						initialDelay: 100,
						maxDelay: 300,
						failAfter: 3,
					},
				});

				client.on('error', (e) => {
					logger.error('Error during LDAP operation', { error: e });
					reject(new LDAPConnectionError(e));
				});

				client.on('connect', () => {
					// only bind if connection is successful + re-bind if the connection was lost and restored
					const bindUser = username || config.searchUser;
					const bindPasword = password || config.searchUserPassword;

					client.bind(bindUser, bindPasword, (err) => {
						if (err) {
							reject(new NotAuthenticated('Wrong credentials'));
						} else {
							logger.debug('[LDAP] Bind successful');
							resolve(client);
						}
					});
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
		async disconnect(config) {
			logger.debug(`[LDAP] Disconnecting from "${config.url}"`);
			try {
				// get client, but don't connect if the connection already broke down:
				const client = await this._getClient(config, false);
				client.destroy(); // will also unbind internally
			} catch (err) {
				if (err instanceof NoClientInstanceError) {
					logger.warning(err);
				} else {
					logger.error('Could not disconnect from LDAP server', { error: err });
				}
			}
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
			return this._connect(config, qualifiedUsername, password).then((connection) => {
				if (connection.connected) {
					connection.unbind();
					return true;
				}
				throw new NotAuthenticated('User could not authenticate');
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

			return this._getClient(config).then(
				(client) =>
					new Promise((resolve, reject) => {
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
								} else {
									reject(new Error('LDAP result code != 0'));
								}
								this.mapOfLocks[config.url].releaseLock();
							});
						});
					})
			);
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
			return this.searchCollection(config, searchString, options).then((objects) => {
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

	app.use('/ldap/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	app.use('/ldap', new LdapService());
	const systemService = app.service('/ldap');
	systemService.hooks(hooks);
};
