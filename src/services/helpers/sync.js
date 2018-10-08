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
			return Promise.all(data.map(school => {
				let schoolData = {
					name: school.displayName,
					systems: ["5bb217cf3505d8796a2aa939"], //ToDo: dont hardcode this
					ldapConfig: config._id,
					ldapSchoolIdentifier: school.ou,
					currentYear: "5b7de0021a3a07c20a1c165e", //18/19
					federalState: "0000b186816abba584714c58" //Niedersachsen
				};
				return app.service('schools').create(schoolData);
			}));
		}

		_createUsersFromLdapData(app, data, school) {
			return Promise.all(data.map(idmUser => {

				if (idmUser.mail == undefined) return Promise.resolve("no email");
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
						ldapId: idmUser.uidNumber //use entryUUID
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
			}));
		}
	}

	return SyncService;
};
