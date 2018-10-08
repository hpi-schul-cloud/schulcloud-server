const errors = require('feathers-errors');

module.exports = function (app) {

	class SyncService {
		constructor() {
			this.ldapService = app.service('ldap');
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
			let config;
			return app.service('ldapConfigs').get("5bb5fd47ab8f0635cea19db8")
				.then(foundConfig => {
					config = foundConfig;
					return this.ldapService.getSchools(config);
				}).then(data => {
					return this._createSchoolsFromLdapData(app, data, config);
				});
		}

		_createSchoolsFromLdapData(app, data, config) {
			return Promise.all(data.map(school => {
				let schoolData = {
					name: school.displayName,
					systems: ["5bb217cf3505d8796a2aa939"], //ToDo: dont hardcode this
					ldapConfig: config._id,
					ldapSchoolIdentifier: school.ou,
					currentYear: "5b7de0021a3a07c20a1c165e", //18/19
					federalState: "0000b186816abba584714c58"
				};
				return app.service('schools').create(schoolData);
			}));
		}

		_createUsersFromLdapData(data, school) {
			return this.ldapService.getUsers(school.ldapConfig, school).then(users => {
				// TODO
			});
		}
	}

	return SyncService;
};
