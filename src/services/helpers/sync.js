const ldap = require('ldapjs');
const errors = require('feathers-errors');

module.exports = function (app) {

	class SyncService {
		constructor() {

        }

		find(params) {
			return this._syncFromLdap(app)
				.then(res => {
					return Promise.resolve({data: true});
				})
				.catch(err => {
					return Promise.reject(err);
				});
		}

		_syncFromLdap(app) {
			return app.service('ldapConfigs').get("5bb73935de31231cefdad572")
				.then(config => {
					return this._getSchoolDataFromLdap(config);
				});
		}

		_getSchoolDataFromLdap(idmConfig) {
			//ToDo: move into ldap service
			const client = ldap.createClient({
				url: idmConfig.url
			});

			const qualifiedUser = `uid=${idmConfig.searchUser},cn=users,${idmConfig.rootPath}`;

			return new Promise((resolve, reject) => {
				client.bind(qualifiedUser, idmConfig.searchUserPw, function(err) {
					if (err) {
						reject(new errors.NotAuthenticated('Wrong credentials'));
					} else {
						resolve(client);
					}
				});
			}).then((client) => {
				const opts = {
					filter: 'univentionObjectType=container/ou',
					scope: 'sub',
					attributes: []
				};

				return new Promise((resolve, reject) => {
					let users = [];
					//client.search(`cn=users,ou=${idmConfig.ou},${idmConfig.rootPath}`, opts, function (err, res) {
					client.search(`${idmConfig.rootPath}`, opts, function (err, res) {
						res.on('searchEntry', function (entry) {
							users.push(entry.object);
						});
						res.on('error', function(error) {
							reject(error);
						});
						res.on('end', function(result) {
							resolve(users);
						});
					});
				});
			});
		}

		_getUserDataFromLdap(idmConfig, school) {
			//ToDo: move into ldap service
			const client = ldap.createClient({
				url: idmConfig.url
			});

			const qualifiedUser = `uid=${idmConfig.searchUser},cn=users,${idmConfig.rootPath}`;

			return new Promise((resolve, reject) => {
				client.bind(qualifiedUser, idmConfig.searchUserPw, function(err) {
					if (err) {
						reject(new errors.NotAuthenticated('Wrong credentials'));
					} else {
						resolve(client);
					}
				});
			}).then((client) => {
				const opts = {
					filter: 'univentionObjectType=container/ou',
					scope: 'sub',
					attributes: []
				};

				return new Promise((resolve, reject) => {
					let users = [];
					client.search(`cn=users,ou=${school.ldapSchoolIdentifier},${idmConfig.rootPath}`, opts, function (err, res) {
						res.on('searchEntry', function (entry) {
							users.push(entry.object);
						});
						res.on('error', function(error) {
							reject(error);
						});
						res.on('end', function(result) {
							resolve(users);
						});
					});
				});
			});
		}

		_createSchoolsFromLdapData(data) {
			//ToDo
			return true;
		}

		_createUsersFromLdapData(data, school) {
			//ToDo
			return true;
		}
	}

	return SyncService;
};