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
			let configPromise = app.service('ldapConfigs').get("5bb73935de31231cefdad572");
			let schoolPromise = app.service('schools').get("0000d186816abba584714c5f");
			return Promise.all([configPromise, schoolPromise])
				.then(([config, school]) => {
					config = Object.assign(config, {ou: school.ldapSchoolIdentifier});
					return this._getDataFromLdap(config);
				});
		}

		_getDataFromLdap(idmConfig) {
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
					filter: 'univentionObjectType=users/user',
					scope: 'sub',
					attributes: []
				};

				return new Promise((resolve, reject) => {
					let users = [];
					client.search(`cn=users,ou=${idmConfig.ou},${idmConfig.rootPath}`, opts, function (err, res) {
						res.on('searchEntry', function (entry) {
							users.push(entry.object);
						});
						res.on('searchReference', function(referral) {
							console.log('referral: ' + referral.uris.join());
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

		_importUsersFromLdapData(data) {

		}
	}

	return SyncService;
};