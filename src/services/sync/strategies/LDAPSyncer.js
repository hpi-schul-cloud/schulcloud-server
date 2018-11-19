const errors = require('feathers-errors');
const logger = require('winston');

const accountModel = require('../../account/model');
const Syncer = require('./Syncer');

class LDAPSchoolSyncer extends Syncer {

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
				return this.createClassesFromLdapData(data);
			});
	}

	createOrUpdateUser(idmUser) {
		return this.app.service('users').find({ query: { ldapId: idmUser.ldapUUID } })
			.then(users => {
				if (users.total != 0) {
					this.stats.users.updated += 1;
					return this.checkForUserChangesAndUpdate(idmUser, users.data[0]);
				}
				return this.createUserAndAccount(idmUser)
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

	createUserAndAccount(idmUser) {
		return this.app.service('registrationPins').create({
			email: idmUser.email,
			verified: true,
			silent: true }).then(registrationPin => {
				return this.app.service('users').create({
					pin: registrationPin.pin,
					firstName: idmUser.firstName,
					lastName: idmUser.lastName,
					schoolId: this.school._id,
					email: idmUser.email,
					ldapDn: idmUser.ldapDn,
					ldapId: idmUser.ldapUUID,
					roles: idmUser.roles
				});
			}).then(user => {
				return accountModel.create({
					userId: user._id,
					username: this.school.ldapSchoolIdentifier + "/" + idmUser.ldapUID,
					systemId: this.system._id,
					activated: true
				});
			});
	}

	checkForUserChangesAndUpdate(idmUser, user) {
		let updateObject = { $set: {} };
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
			{username: this.school.ldapSchoolIdentifier + "/" + idmUser.ldapUID}
		).then(_ => {
			return this.app.service('users').update(
				{_id: user._id},
				updateObject);
		});
	}

	createClassesFromLdapData(data) {
		let res = Promise.all(data.map(ldapClass => {
			return this.getOrCreateClassFromLdapData(ldapClass)
			.then(currentClass => {
				return this.populateClassUsers(ldapClass, currentClass);
			});
		}));
		return res;
	}

	getOrCreateClassFromLdapData(data) {
		return this.app.service('classes').find({query: {ldapDN: data.ldapDn}})
		.then(res => {
			if (res.total == 0) {
				let newClass = {
					name: data.className,
					schoolId: this.school._id,
					nameFormat: "static",
					ldapDN: data.ldapDn,
					year: this.school.currentYear
				};
				return this.app.service('classes').create(newClass);
			} else {
				return res.data[0];
			}
		});
	}

	populateClassUsers(ldapClass, currentClass) {
		let students = [], teachers = [];
		if (!("uniqueMembers" in ldapClass)) {
			return Promise.resolve();
		}
		if (Array.isArray(ldapClass.uniqueMembers) == false) {
			ldapClass.uniqueMembers = [ldapClass.uniqueMembers];
		}
		return Promise.all(ldapClass.uniqueMembers.map(ldapUserDn => {
			return this.app.service('users').find({query: {ldapDn: ldapUserDn, $populate:['roles']}})
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
			return this.app.service('classes').patch(currentClass._id,{$set: {userIds: students, teacherIds: teachers}});
		}).catch(err => {
			return Promise.reject(err);
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
					const syncer = new LDAPSchoolSyncer(this.app, this.system, this.getSchoolStats(school), school);
					return syncer.sync();
				});
				return Promise.all(jobs);
			});
	}

	getSchools() {
		return this.app.service('ldap').getSchools(this.system.ldapConfig)
			.then(data => this.createSchoolsFromLdapData(data));
	}

	getSchoolStats(school) {
		if (! this.stats.schools[school.ldapSchoolIdentifier]) {
			this.stats.schools[school.ldapSchoolIdentifier] = {};
		}
		return this.stats.schools[school.ldapSchoolIdentifier];
	}

	getCurrentYearAndFederalState() {
		return Promise.all([
			this.app.service('years').find({ $orderby: { name: -1 } }),
			this.app.service('federalStates').find({ query: { abbreviation: 'NI' } })
		]).then(([years, states]) => {
			if (years.total == 0 || states.total == 0) {
				return Promise.reject('Database should contain at least one year and one valid federal state');
			}
			return Promise.resolve({ currentYear: years.data[0]._id, federalState: states.data[0]._id });
		});
	}

	createSchoolsFromLdapData(data) {
		this.logInfo(`Got ${data.length} schools from the server`);
		let newSchools = 0;
		let updates = 0;
		return Promise.all(data.map(ldapSchool => {
			return this.app.service('schools').find({ query: { ldapSchoolIdentifier: ldapSchool.ldapOu } })
				.then(schools => {
					if (schools.total != 0) {
						updates += 1;
						return this.app.service('schools').update(
							{_id: schools.data[0]._id},
							{$set: {name: ldapSchool.displayName}});
					}

					return this.getCurrentYearAndFederalState()
					.then(({currentYear, federalState}) => {
						const schoolData = {
							name: ldapSchool.displayName,
							systems: [this.system._id],
							ldapSchoolIdentifier: ldapSchool.ldapOu,
							currentYear: currentYear,
							federalState: federalState
						};
						newSchools += 1;
						return this.app.service('schools').create(schoolData);
					});
				});
		}))
		.then((res) => {
			this.logInfo(`Created ${newSchools} new schools and updated ${updates} schools`);
			return Promise.resolve(res);
		});
	}
}

module.exports = LDAPSyncer;
