const errors = require('feathers-errors');
const accountModel = require('../account/model');
const logger = require('winston');

const syncFromLdap = function(app) {
	let successfulSystems = 0, erroredSystems = 0;
	logger.info('Syncing from LDAP');
	return app.service('systems').find({ query: { type: 'ldap' } })
		.then(ldapSystems => {
			logger.info(`Found ${ldapSystems.total} LDAP configurations.`);
			return Promise.all(ldapSystems.data.map(system => {
				logger.info(`Syncing ${system.alias} (${system._id})...`);
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
									logger.info(`[${school.name}] Getting classes...`);
									return app.service('ldap').getClasses(config, school);
								}).then(data => {
									logger.info(`[${school.name}] Creating classes`);
									return createClassesFromLdapData(app, data, school);
								}).then(_ => {
									logger.info(`[${school.name}] Done.`);
									return Promise.resolve();
								});
						}));
					})
					.then(_ => {
						successfulSystems += 1;
						logger.info(`Finished syncing ${system.alias} (${system._id})`);
						return Promise.resolve();
					})
					.catch(err => {
						erroredSystems += 1;
						logger.error(`Error while syncing ${system.alias} (${system._id}): `, err);
						return Promise.resolve();
					});
			}));
		})
		.then(res => {
			logger.info(`Sync finished. Successful system syncs: ${successfulSystems}, Errors: ${erroredSystems}`);
			return Promise.resolve();
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
			return app.service('users').create({
				pin: registrationPin.pin,
				firstName: idmUser.firstName,
				lastName: idmUser.lastName,
				schoolId: school._id,
				email: idmUser.email,
				ldapDn: idmUser.ldapDn,
				ldapId: idmUser.ldapUUID,
				roles: idmUser.roles
			});
		}).then(user => {
			return accountModel.create({
				userId: user._id,
				username: school.ldapSchoolIdentifier + "/" + idmUser.ldapUID,
				systemId: system._id,
				activated: true
			});
		});
};

const createUsersFromLdapData = function(app, data, school, system) {
	logger.info(`[${school.name}] Getting users...`);
	let usersCreated = 0, usersUpdated = 0, userErrors = 0;
	return Promise.all(data.map(idmUser => {
		return app.service('users').find({ query: { ldapId: idmUser.ldapUUID } })
			.then(users => {
				if (users.total != 0) {
					usersUpdated += 1;
					return checkForUserChangesAndUpdate(app, idmUser, users.data[0], school);
				}
				return createUserAndAccount(app, idmUser, school, system)
					.then(res => {
						usersCreated += 1;
						return res;
					})
					.catch(err=> {
						userErrors += 1;
						logger.error(`[${school.name}] User creation error: `, err);
						return {};
					});
			});
	})).then(res => {
		logger.info(`[${school.name}] Created ${usersCreated} users, updated ${usersUpdated} users. Skipped errors: ${userErrors}.`);
		return Promise.resolve(res);
	});
};

const checkForUserChangesAndUpdate = function(app, idmUser, user, school) {
	let updateObject = {$set: {}};
	if (user.firstName != idmUser.firstName) {
		updateObject.$set['firstName'] = idmUser.firstName || ' ';
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
	let res = Promise.all(data.map(ldapClass => {
		return getOrCreateClassFromLdapData(app, ldapClass, school)
		.then(currentClass => {
			return populateClassUsers(app, ldapClass, currentClass);
		});
	}));
	return res;
};

const getOrCreateClassFromLdapData = function(app, data, school) {
	return app.service('classes').find({query: {ldapDN: data.ldapDn}})
	.then(res => {
		if (res.total == 0) {
			let newClass = {
				name: data.className,
				schoolId: school._id,
				nameFormat: "static",
				ldapDN: data.ldapDn,
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
	if (!("uniqueMembers" in ldapClass)) {
		return Promise.resolve();
	}
	if (Array.isArray(ldapClass.uniqueMembers) == false) {
		ldapClass.uniqueMembers = [ldapClass.uniqueMembers];
	}
	return Promise.all(ldapClass.uniqueMembers.map(ldapUserDn => {
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
