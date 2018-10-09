const errors = require('feathers-errors');
const accountModel = require('../account/model');

module.exports = function (app) {

	class SyncService {
		constructor() {
			this.ldapService = app.service('ldap');
		}

		find(params) {
			if (params.query.target == "ldap") {
				return this._syncFromLdap(app)
				.then(res => {
					return Promise.resolve({ data: true });
				})
				.catch(err => {
					return Promise.reject(err);
				});
			} else {
				return Promise.reject("target not found");
			}
			
		}

		_syncFromLdap(app) {
			return app.service('ldapConfigs').find({query: {}})
			.then(foundConfigs => {
				return Promise.all(foundConfigs.data.map(config => {
					return this.ldapService.getSchools(config)
						.then(data => {
							return this._createSchoolsFromLdapData(app, data, config);
						}).then(schools => {
							return Promise.all(schools.map(school => {
								return this.ldapService.getUsers(config, school)
									.then(data => {
										return this._createUsersFromLdapData(app, data, school);
									});
							}));
						});
				}));
			});
		}

		_createSchoolsFromLdapData(app, data, config) {
			return app.service('systems').find({ query: { type: 'ldap' } })
				.then(systems => {
					if (systems.total != 0) {
						const ldapSystem = systems.data[0];
						return Promise.all(data.map(ldapSchool => {
							return app.service('schools').find({ query: { ldapSchoolIdentifier: ldapSchool.ou } })
								.then(schools => {
									if (schools.total != 0) {
										return Promise.resolve(schools.data[0]);
									}
									let schoolData = {
										name: ldapSchool.displayName,
										systems: [ldapSystem._id],
										ldapConfig: config._id,
										ldapSchoolIdentifier: ldapSchool.ou,
										currentYear: "5b7de0021a3a07c20a1c165e", //18/19
										federalState: "0000b186816abba584714c58" //Niedersachsen
									};
									return app.service('schools').create(schoolData);
								});
						}));
					} else {
						Promise.reject('There\'s no ldap System');
					}
				});
		}

		_createUserAndAccount(app, idmUser, school) {
			let email = idmUser.mail;
			//todo: avoid faking a pin verification process
			return app.service('registrationPins').create({ "email": email, verified: true })
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
						systemId: "5bb217cf3505d8796a2aa939"//toDo: dont hardcode
					};
					//return accountModel.create(accountData);
					//-------------------------------------------------------------------
					//THIS IS FOR DEMO ONLY, AND HAS TO BE REMOVED BEFORE NOVEMBER!!!!!
					let accountPromise = accountModel.create(accountData);
					let consentData = {
						userId: user._id,
						parentConsents: [{
							form: "analog",
							privacyConsent: true,
							termsOfUseConsent: true,
							thirdPartyConsent: true,
							researchConsent: true
						}]
					};
					let consentPromise = app.service('consents').create(consentData);
					return Promise.all([accountPromise, consentPromise])
						.then(([account, consent]) => {
							return Promise.resolve(account);
						});
					//-------------------------------------------------------------------
				});
		}

		_createUsersFromLdapData(app, data, school) {
			return Promise.all(data.map(idmUser => {

				return app.service('users').find({ query: { ldapId: idmUser.entryUUID } })
					.then(users => {
						if (users.total != 0) {
							//toDo: check for changes
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
