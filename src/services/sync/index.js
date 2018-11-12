const errors = require('feathers-errors');
const accountModel = require('../account/model');
const logger = require('winston');

const syncFromLdap = function(app) {
	logger.info('Syncing from LDAP');
	return app.service('systems').find({ query: { type: 'ldap', name: 'NIGE' } })
		.then(ldapSystems => {
			logger.info(`Found ${ldapSystems.total} LDAP configurations.`);
			return Promise.all(ldapSystems.data.map(system => {
				logger.info(`Syncing ${system._id}...`);
				const config = system.ldapConfig;
				return app.service('ldap').getSchools(config)
					.then(data => {
						return createSchoolsFromLdapData(app, data, system);
					}).then(schools => {
						return Promise.all(schools.map(school => {
							return app.service('ldap').getUsers(config, school)
								.then(data => {
									return createUsersFromLdapData(app, data, school, system);
								}).then(_ => {
									return app.service('ldap').getClasses(config, school);
								}).then(data => {
									return createClassesFromLdapData(app, data, school);
								});
						}));
					})
					.then(res => {
						logger.log(`Finished syncing ${system.id}`);
						return Promise.resolve(res);
					});
			}));
		});
};

const getCurrentYearAndFederalState = function(app) {
	return Promise.all([
		app.service('years').find({ $orderby: { name: -1 } }),
		app.service('federalStates').find({ query: { abbreviation: 'NI' } })
	]).then(([years, states]) => {
		if (years.total == 0 || states.total == 0) {
			return Promise.reject('Database should contain at least one year and one valid federal state');
		}
		return Promise.resolve({ currentYear: years.data[0]._id, federalState: states.data[0]._id });
	});
};

const createSchoolsFromLdapData = function(app, data, system) {
	logger.info(`Got ${data.length} schools from the server`);
	let newSchools = 0;
	let updates = 0;
	return Promise.all(data.map(ldapSchool => {
		return app.service('schools').find({ query: { ldapSchoolIdentifier: ldapSchool.ldapOu } })
			.then(schools => {
				if (schools.total != 0) {
					updates += 1;
					return app.service('schools').update(
						{_id: schools.data[0]._id},
						{$set: {name: ldapSchool.displayName}});
				}

				return getCurrentYearAndFederalState(app)
				.then(({currentYear, federalState}) => {
					const schoolData = {
						name: ldapSchool.displayName,
						systems: [system._id],
						ldapSchoolIdentifier: ldapSchool.ldapOu,
						currentYear: currentYear,
						federalState: federalState
					};
					newSchools += 1;
					return app.service('schools').create(schoolData);
				});
			});
	}))
	.then((res) => {
		logger.info(`Created ${newSchools} new schools and updated ${updates} schools`);
		return Promise.resolve(res);
	});
};

const createUserAndAccount = function(app, idmUser, school, system) {
	return app.service('registrationPins').create({ email: idmUser.email, verified: true, silent: true })
		.then(registrationPin => {
			let newUserData = {
				pin: registrationPin.pin,
				firstName: idmUser.firstName,
				lastName: idmUser.lastName,
				schoolId: school._id,
				email: idmUser.email,
				ldapDn: idmUser.ldapDn,
				ldapId: idmUser.ldapUUID,
				roles: idmUser.roles
			};

			return app.service('users').create(newUserData);
		}).then(user => {
			let accountData = {
				userId: user._id,
				username: school.ldapSchoolIdentifier + "/" + idmUser.ldapUID,
				systemId: system._id,
				activated: true
			};
			return accountModel.create(accountData);
		});
};

const createUsersFromLdapData = function(app, data, school, system) {
	return Promise.all(data.map(idmUser => {

		return app.service('users').find({ query: { ldapId: idmUser.ldapUUID } })
			.then(users => {
				if (users.total != 0) {
					return checkForUserChangesAndUpdate(app, idmUser, users.data[0], school);
				}
				if (idmUser.email == undefined) return Promise.resolve("no email");
				return createUserAndAccount(app, idmUser, school, system);
			});

	}));
};

const checkForUserChangesAndUpdate = function(app, idmUser, user, school) {
	let updateObject = {$set: {}};
	if (user.firstName != idmUser.firstName) {
		updateObject.$set['firstName'] = idmUser.firstName;
	}
	if (user.lastName != idmUser.lastName) {
		updateObject.$set['lastName'] = idmUser.lastName;
	}
	//Updating SchoolId will cause an issue. We need to discuss about it
	if (user.email != idmUser.email) {
		updateObject.$set['email'] = idmUser.email;
	}
	if (user.ldapDn != idmUser.ldapDn) {
		updateObject.$set['ldapDn'] = idmUser.ldapDn;
	}

	// Role
	updateObject.$set["roles"] = idmUser.roles;

	return accountModel.update(
		{userId: user._id},
		{username: school.ldapSchoolIdentifier + "/" + idmUser.ldapUID}
	).then(_ => {
		return app.service('users').update(
			{_id: user._id},
			updateObject);
	});
};

const createClassesFromLdapData = function(app, data, school) {
	return Promise.all(data.map(ldapClass => {
		return getOrCreateClassFromLdapData(app, ldapClass, school)
		.then(currentClass => {
			return populateClassUsers(app, ldapClass, currentClass);
		});
	}));
};

const getOrCreateClassFromLdapData = function(app, data, school) {
	return app.service('classes').find({query: {ldapDN: data.dn}})
	.then(res => {
		if (res.total == 0) {
			let splittedName = data.cn.split("-");
			let className = splittedName[splittedName.length-1];
			let newClass = {
				name: className,
				schoolId: school._id,
				nameFormat: "static",
				ldapDN: data.dn,
				year: school.currentYear
			};
			return app.service('classes').create(newClass);
		} else {
			return res.data[0];
		}
	});
};

const populateClassUsers = function(app, ldapClass, currentClass) {
	let students = [], teachers = [];
	if (!("uniqueMember" in ldapClass)) {
		return Promise.resolve();
	}
	if (Array.isArray(ldapClass.uniqueMember) == false) {
		ldapClass.uniqueMember = [ldapClass.uniqueMember];
	}
	return Promise.all(ldapClass.uniqueMember.map(ldapUserDn => {
		return app.service('users').find({query: {ldapDn: ldapUserDn, $populate:['roles']}})
		.then(user => {
			if (user.total > 0) {
				user = user.data[0];
				user.roles.map(role => {
					if (role.name == "student") students.push(user._id);
					if (role.name == "teacher") teachers.push(user._id);
				});
			}
			return Promise.resolve();
		});
	})).then(_ => {
		if (students.length == 0 && teachers.length == 0) return Promise.resolve();
		return app.service('classes').patch(currentClass._id,{$set: {userIds: students, teacherIds: teachers}});
	}).catch(err => {
		return Promise.reject(err);
	});

};

module.exports = function () {

	const app = this;

	class SyncService {
		constructor() {}

		find(params) {
			if (params.query.target == 'ldap') {
				return syncFromLdap(app);
			} else {
				return Promise.reject('target not found');
			}

		}
	}

	app.use('/sync', new SyncService());
};
