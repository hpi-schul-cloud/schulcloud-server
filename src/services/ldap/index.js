const ldap = require('ldapjs');
const errors = require('feathers-errors');

const getLDAPStrategy = require('./strategies');

module.exports = function() {

	class LdapService {

		constructor() {
			this.clients = {};
		}

		find(params) {
			return app.service('users').find({
				query: { firstName: 'Ailbert' }
			})
			.then(users => {
				const config = {provider: 'univention'};
				const team = {
					name: 'Friday Beers',
					_id: '1234567890'
				};
				if (params.query.method === 'add') {
					return this.addUserToTeam(config, users.data[0], team);
				} else {
					return this.removeUserFromTeam(config, users.data[0], team);
				}
			});
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
				filter: config.filters.schools,
				scope: 'sub',
				attributes: []
			};

			return this.searchCollection(config, `${config.rootPath}`, options);
		}

		getUsers(config, school) {
			const options = {
				filter: config.filters.users,
				scope: 'sub',
				attributes: ["givenName", "sn", "mail", "dn", "entryUUID", "uid", "objectClass", "memberOf"]
			};

			const searchString = `cn=users,ou=${school.ldapSchoolIdentifier},${config.rootPath}`;
			return this.searchCollection(config, searchString, options);
		}

		_teamToGroup(team) {
			return {
				name: `schulcloud-${team._id}`,
				description: team.name
			};
		}

		addUserToTeam(config, user, team) {
			const group = this._teamToGroup(team);
			return getLDAPStrategy(config).addUserToGroup(user, group);
		}

		removeUserFromTeam(config, user, team) {
			const group = this._teamToGroup(team);
			return getLDAPStrategy(config).removeUserFromGroup(user, group);
		}

	}

	const app = this;
	app.use('/ldap', new LdapService());
};
