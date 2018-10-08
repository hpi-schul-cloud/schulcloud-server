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

		_removeClient(config) {
			return new Promise((resolve, reject) => {
				if (! (config && config._id)) {
					reject('Invalid config object');
				}
				this._getClient(config).unbind(function(err) {
					if (err) {
						reject(err);
					}
					delete this.clients[config._id];
					resolve(true);
				});
			});
		}

		_getClient(config) {
			let client = this.clients[config];
			if (client) {
				return Promise.resolve(client);
			} else {
				return this._connect(config);
			}
		}

		_connect(config) {
			const client = ldap.createClient({
				url: config.url
			});
			const loginUser = `uid=${config.searchUser},cn=users,${config.rootPath}`;
			return new Promise((resolve, reject) => {
				client.bind(loginUser, config.searchUserPassword, (err) => {
					if (err) {
						reject(new errors.NotAuthenticated('Wrong credentials'));
					} else {
						this._addClient(config, client);
						resolve(client);
					}
				});
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
						res.on('searchEntry', function (entry) {
							objects.push(entry.object);
						});
						res.on('end', function(result) {
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

		getSchools(config) {
			const options = {
				filter: 'univentionObjectType=container/ou',
				scope: 'sub',
				attributes: []
			};

			return this.searchCollection(config, `${config.rootPath}`, options);
		}

		getUsers(config, school) {
			const options = {
				filter: 'univentionObjectType=users/user',
				scope: 'sub',
				attributes: []
			};

			const searchString = `cn=users,ou=${school.ldapSchoolIdentifier},${config.rootPath}`;
			return this.searchCollection(config, searchString, options);
		}
	}

	return LdapService;
};
