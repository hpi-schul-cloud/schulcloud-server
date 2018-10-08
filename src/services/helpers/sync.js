const errors = require('feathers-errors');
const accountModel = require('../account/model');

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
			return app.service('ldapConfigs').get("5bb73935de31231cefdad572")
				.then(foundConfig => {
					config = foundConfig;
					return this.ldapService.getSchools(config);
				}).then(data => {
					return this._createSchoolsFromLdapData(app, data, config);
				}).then(schools => {
					return Promise.all(schools.map(school => {
						return this.ldapService.getUsers(config, school)
						.then(data => {
							return this._createUsersFromLdapData(app, data, school);
						});
					}));
				});
		}

		_createSchoolsFromLdapData(app, data, config) {
			return Promise.all(data.map(ldapSchool => {
				return app.service('schools').find({query: {ldapSchoolIdentifier: ldapSchool.ou}})
				.then(schools => {
					if (schools.total != 0) {
						return Promise.resolve(schools.data[0]);
					}
					let schoolData = {
						name: ldapSchool.displayName,
						systems: ["5bb217cf3505d8796a2aa939"], //ToDo: dont hardcode this, do for all ldap
						ldapConfig: config._id,
						ldapSchoolIdentifier: ldapSchool.ou,
						currentYear: "5b7de0021a3a07c20a1c165e", //18/19
						federalState: "0000b186816abba584714c58" //Niedersachsen
					};
					return app.service('schools').create(schoolData);
				});
			}));
		}

		_createUserAndAccount(app, idmUser, school) {
			let email = idmUser.mail;
			//todo: avoid faking a pin verification process
			return app.service('registrationPins').create({"email": email, verified: true})
			.then(registrationPin => {
				let newUserData = {
					pin: registrationPin.pin,
					firstName: idmUser.givenName,
					lastName: idmUser.sn,
					schoolId: school._id,
					email: email,
					ldapDn: idmUser.dn,
					ldapId: idmUser.entryUUID
				};
				if (idmUser.objectClass.includes("ucsschoolTeacher")) {
					newUserData.role = "teacher";
				}
				if (idmUser.objectClass.includes("ucsschoolStudent")) {
					newUserData.role = "student";
				}
				if (idmUser.objectClass.includes("ucsschoolStaff")) {
					//toDo
				}

				return app.service('users').create(newUserData);
			}).then(user => {
				let accountData = {
					userId: user._id,
					username: school.ldapSchoolIdentifier + "/" + idmUser.uid,
					systemId: "5bb217cf3505d8796a2aa939" //toDo: dont hardcode
				};
				return accountModel.create(accountData);
			});
		}

		_createUsersFromLdapData(app, data, school) {
			return Promise.all(data.map(idmUser => {
				
				return app.service('users').find({query: {ldapId: idmUser.entryUUID}})
				.then(users => {
					if (users.total != 0) {
						return Promise.resolve(users.data[0]);
					}
					if (idmUser.mail == undefined) return Promise.resolve("no email");
					return this._createUserAndAccount(app, idmUser, school);
				});
				
			}));
		}
	}

	return SyncService;
};
