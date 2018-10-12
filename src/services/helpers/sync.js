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
			return app.service('systems').find({ query: { type: 'ldap' } })
				.then(ldapSystems => {
					return Promise.all(ldapSystems.data.map(system => {
						const config = system.ldapConfig;
						return this.ldapService.getSchools(config)
							.then(data => {
								return this._createSchoolsFromLdapData(app, data, system);
							}).then(schools => {
								return Promise.all(schools.map(school => {
									return this.ldapService.getUsers(config, school)
										.then(data => {
											return this._createUsersFromLdapData(app, data, school, system);
										});
								}));
							});
					}));
				});
		}

		_createSchoolsFromLdapData(app, data, system) {
			return Promise.all(data.map(ldapSchool => {
				return app.service('schools').find({ query: { ldapSchoolIdentifier: ldapSchool.ou } })
					.then(schools => {
						if (schools.total != 0) {
							return app.service('schools').update(
								{_id: schools.data[0]._id},
								{$set: {name: ldapSchool.displayName}});
						}
						const schoolData = {
							name: ldapSchool.displayName,
							systems: [system._id],
							ldapSchoolIdentifier: ldapSchool.ou,
							currentYear: "5b7de0021a3a07c20a1c165e", //18/19
							federalState: "0000b186816abba584714c58" //Niedersachsen
						};
						return app.service('schools').create(schoolData);
					});
			}));
		}

		_createUserAndAccount(app, idmUser, school, system) {
			let email = idmUser.mail;
			return app.service('registrationPins').create({ email, verified: true, silent: true })
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
						newUserData.roles = "teacher";
					}
					if (idmUser.objectClass.includes("ucsschoolStudent")) {
						newUserData.roles = "student";
					}
					if (idmUser.objectClass.includes("ucsschoolStaff")) {
						//toDo
					}

					return app.service('users').create(newUserData);
				}).then(user => {
					let accountData = {
						userId: user._id,
						username: school.ldapSchoolIdentifier + "/" + idmUser.uid,
						systemId: system._id,
						activated: true
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

		_createUsersFromLdapData(app, data, school, system) {
			return Promise.all(data.map(idmUser => {

				return app.service('users').find({ query: { ldapId: idmUser.entryUUID } })
					.then(users => {
						if (users.total != 0) {
							return this._checkForUserChangesAndUpdate(app, idmUser, users.data[0], school);
						}
						if (idmUser.mail == undefined) return Promise.resolve("no email");
						return this._createUserAndAccount(app, idmUser, school, system);
					});

			}));
		}

		_checkForUserChangesAndUpdate(app, idmUser, user, school) {
			let updateObject = {$set: {}};
			if(user.firstName != idmUser.givenName) {
				updateObject.$set['firstName'] = idmUser.givenName;
			}
			if(user.lastName != idmUser.sn) {
				updateObject.$set['lastName'] = idmUser.sn;
			}
			//Updating SchoolId will cause an issue. We need to discuss about it
			if(user.email != idmUser.mail) {
				updateObject.$set['email'] = idmUser.mail;
			}
			if(user.ldapDn != idmUser.dn) {
				updateObject.$set['ldapDn'] = idmUser.dn;
			}

			// Role
			updateObject.$set["roles"] = [];
			if (idmUser.objectClass.includes("ucsschoolTeacher")) {
				updateObject.$set["roles"].push("teacher");
			}
			if (idmUser.objectClass.includes("ucsschoolStudent")) {
				updateObject.$set["roles"].push("student");
			}
			if (idmUser.objectClass.includes("ucsschoolStaff")) {
				//ToDo
			}
			
			return app.service('users').update(
				{_id: user._id},
				updateObject);

		}
	}

	return SyncService;
};
