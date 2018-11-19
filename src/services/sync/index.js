const errors = require('feathers-errors');
const accountModel = require('../account/model');
const logger = require('winston');

class Syncer {
	constructor(app, system, stats={}) {
		this.app = app;
		this.system = system;
		this.stats = Object.assign(stats, {
			successful: 0,
			failed: 0,
		});
	}

	prefix() {
		return `${this.system.alias}`;
	}

	sync() {
		this.logInfo('Started syncing');
		return this.steps()
		.then(_ => {
			this.stats.successful += 1;
			this.logInfo('Finished syncing.');
			return Promise.resolve(this.stats);
		})
		.catch(err => {
			this.stats.failed += 1;
			this.logError('Error while syncing', err);
			return Promise.resolve(this.stats);
		});
	}

	steps() {
		return Promise.resolve();
	}

	logInfo(message, ...args) {
		logger.info(`[${this.prefix()}] ${message}`, ...args);
	}

	logWarning(message, ...args) {
		logger.warn(`[${this.prefix()}] ${message}`, ...args);
	}

	logError(message, ...args) {
		logger.error(`[${this.prefix()}] ${message}`, ...args);
	}
}

class SchoolSyncer extends Syncer {

	constructor(app, system, stats, school) {
		super(app, system, stats);
		this.school = school;
		this.stats = Object.assign(this.stats, {
			name: this.school.name,
			users: {
				created: 0,
				updated: 0,
				errors: 0,
			},
		});
	}

	prefix() {
		return `${super.prefix()} | ${this.school.name}`;
	}

	steps() {
		return super.steps()
			.then(_ => this.getUserData())
			.then(_ => this.getClassData());
	}

	getUserData() {
		this.logInfo('Getting users...');
		return this.app.service('ldap').getUsers(this.system.ldapConfig, this.school)
			.then(ldapUsers => {
				return Promise.all(ldapUsers.map(idmUser =>
					this.createOrUpdateUser(idmUser, this.school)
				))
				.then(res => {
					this.logInfo(`Created ${this.stats.users.created} users, `
								+ `updated ${this.stats.users.updated} users. `
								+ `Skipped errors: ${this.stats.users.errors}.`);
					return Promise.resolve(res);
				});
			});
	}

	getClassData() {
		this.logInfo('Getting classes...');
		return this.app.service('ldap').getClasses(this.system.ldapConfig, this.school)
			.then(data => {
				this.logInfo('Creating classes');
				return createClassesFromLdapData(this.app, data, this.school);
			});
	}

	createOrUpdateUser(idmUser) {
		return this.app.service('users').find({ query: { ldapId: idmUser.ldapUUID } })
			.then(users => {
				if (users.total != 0) {
					this.stats.users.updated += 1;
					return checkForUserChangesAndUpdate(this.app, idmUser, users.data[0], this.school);
				}
				return createUserAndAccount(this.app, idmUser, this.school, this.system)
					.then(res => {
						this.stats.users.created += 1;
						return res;
					})
					.catch(err=> {
						this.stats.users.errors += 1;
						this.logError('User creation error', err);
						return {};
					});
			});
	}
}
class LDAPSyncer extends Syncer {

	constructor(app, system) {
		super(app, system);
		this.stats = Object.assign(this.stats, {
			schools: {},
		});
	}

	steps() {
		return super.steps()
			.then(() => this.getSchools())
			.then((schools) => {
				const jobs = schools.map(school => {
					const syncer = new SchoolSyncer(this.app, this.system, this.getSchoolStats(school), school);
					return syncer.sync();
				});
				return Promise.all(jobs);
			});
	}

	getSchools() {
		return this.app.service('ldap').getSchools(this.system.ldapConfig)
			.then(data => {
				return createSchoolsFromLdapData(this.app, data, this.system);
			});
	}

	getSchoolStats(school) {
		if (! this.stats.schools[school.ldapSchoolIdentifier]) {
			this.stats.schools[school.ldapSchoolIdentifier] = {};
		}
		return this.stats.schools[school.ldapSchoolIdentifier];
	}
}

const getSystems = (app, type) => {
	return app.service('systems').find({ query: { type } })
		.then(systems => {
			logger.info(`Found ${systems.total} ${type} configurations.`);
			return systems.data;
		});
};

const syncFromLdap = function(app) {
	logger.info('Syncing from LDAP');
	return getSystems(app, 'ldap').then(ldapSystems => {
		return Promise.all(ldapSystems.map(system => {
			const syncer = new LDAPSyncer(app, system);
			return syncer.sync();
		}));
	})
	.then((stats) => {
		const aggregated = stats.reduce((agg, cur) => {
			agg.successful += cur.successful;
			agg.failed += cur.failed;
			return agg;
		}, { successful: 0, failed: 0 });
		logger.info(`Sync finished. Successful system syncs: ${aggregated.successful}, Errors: ${aggregated.failed}`);
		return Promise.resolve(stats);
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
