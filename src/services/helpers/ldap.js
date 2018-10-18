const ldap = require('ldapjs');
const errors = require('feathers-errors');

module.exports = function (app) {

	class LdapService {

		constructor() {
			this.clients = {};
		}

		find(params) {

		}

		_addClient(config, client) {
			this.clients[config._id] = client;
		}

		_getClient(config) {
			let client = this.clients[config._id];
			if (client && client.connected) {
				return Promise.resolve(client);
			} else {
				return this._connect(config).then((client) => {
					this._addClient(config, client);
					return Promise.resolve(client);
				});
			}
		}

		_connect(config, username, password) {
			username = username || `uid=${config.searchUser},cn=users,${config.rootPath}`;
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

		authenticate(system, qualifiedUsername, password) {
			const config = system.ldapConfig;
			return this._connect(config, qualifiedUsername, password)
				.then(() => {
					const options = {
						filter: null,
						scope: 'sub',
						attributes: []
					};
					const searchString = `${qualifiedUsername}`;
					return this.searchObject(config, searchString, options);
				});
		}

		searchCollection(config, searchString, options) {
			return this._getClient(config).then((client) => {
				return new Promise((resolve, reject) => {
					let objects = [];
					client.search(searchString, options, function (err, res) {
						if (err) {
							reject(err);
						}
						res.on('error', reject);
						res.on('searchEntry', (entry) => {
							objects.push(entry.object);
						});
						res.on('end', (result) => {
							if (result.status === 0) {
								resolve(objects);
							} else {
								reject('LDAP result code != 0');
							}
						});
					});
				});
			});
		}

		searchObject(config, searchString, options) {
			return this.searchCollection(config, searchString, options)
				.then((objects) => {
					if (objects.length > 0) {
						return Promise.resolve(objects[0]);
					}
					return Promise.reject('Object not found');
				});
		}

		getSchools(config) {
			const options = {
				// search for organizational units which do not have the no_school role
				filter: '(&(univentionObjectType=container/ou)(!(ucsschoolRole=school:ou:no_school)))',
				scope: 'sub',
				attributes: []
			};

			return this.searchCollection(config, `${config.rootPath}`, options);
		}

		getUsers(config, school) {
			const options = {
				filter: 'univentionObjectType=users/user',
				scope: 'sub',
				attributes: ["givenName", "sn", "mail", "dn", "entryUUID", "uid", "objectClass", "memberOf"]
			};

			const searchString = `cn=users,ou=${school.ldapSchoolIdentifier},${config.rootPath}`;
			return this.searchCollection(config, searchString, options);
		}

		//TODO should be called if a user is added or removed from a school group
		updateUserGroups(config, user) {
			//TODO First idea ... currently specification is missing
			const changes = new ldap.Change({
				operation: 'add',
				modification: {
					groups: ['groupId1', 'groupId2']
				}
			});

			return this._getClient(config).then((client) => {
				return new Promise((resolve, reject) => {
					client.modify(user.ldapDn, changes, function (err, res) {
						if (err) {
							reject(err);
						}
						res.on('error', reject);
						res.on('end', (result) => {
							if (result.status === 0) {
								resolve(res);
							} else {
								reject('LDAP result code != 0');
							}
						});
					});
				});
			});
		}
	}

	return LdapService;
};
