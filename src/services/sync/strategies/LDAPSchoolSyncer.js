const errors = require('feathers-errors');

const accountModel = require('../../account/model');
const SystemSyncer = require('./SystemSyncer');

/**
 * Implements syncing schools from LDAP servers based on the Syncer interface
 * @class LDAPSyncer
 * @implements {Syncer}
 */
class LDAPSchoolSyncer extends SystemSyncer {
	constructor(app, stats, system, school) {
		super(app, stats, system);
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

	/**
	 * @see {Syncer#prefix}
	 */
	prefix() {
		return `${super.prefix()} | ${this.school.name}`;
	}

	/**
	 * @see {Syncer#steps}
	 */
	steps() {
		return super.steps()
			.then(_ => this.getUserData())
			.then(_ => this.getClassData())
			.then(_ => this.stats);
	}

	getUserData() {
		this.logInfo('Getting users...');
		return this.app.service('ldap').getUsers(this.system.ldapConfig, this.school)
			.then(ldapUsers => Promise.all(ldapUsers.map(idmUser => this.createOrUpdateUser(idmUser, this.school)))
				.then((res) => {
					this.logInfo(`Created ${this.stats.users.created} users, `
								+ `updated ${this.stats.users.updated} users. `
								+ `Skipped errors: ${this.stats.users.errors}.`);
					return Promise.resolve(res);
				}));
	}

	getClassData() {
		this.logInfo('Getting classes...');
		return this.app.service('ldap').getClasses(this.system.ldapConfig, this.school)
			.then((data) => {
				this.logInfo('Creating classes');
				return this.createClassesFromLdapData(data);
			});
	}

	createOrUpdateUser(idmUser) {
		return this.app.service('users').find({ query: { ldapId: idmUser.ldapUUID } })
			.then((users) => {
				if (users.total != 0) {
					this.stats.users.updated += 1;
					return this.checkForUserChangesAndUpdate(idmUser, users.data[0]);
				}
				return this.createUserAndAccount(idmUser)
					.then((res) => {
						this.stats.users.created += 1;
						return res;
					})
					.catch((err) => {
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
			silent: true,
		}).then(registrationPin => this.app.service('users').create({
			pin: registrationPin.pin,
			firstName: idmUser.firstName,
			lastName: idmUser.lastName,
			schoolId: this.school._id,
			email: idmUser.email,
			ldapDn: idmUser.ldapDn,
			ldapId: idmUser.ldapUUID,
			roles: idmUser.roles,
		})).then(user => accountModel.create({
			userId: user._id,
			username: (`${this.school.ldapSchoolIdentifier}/${idmUser.ldapUID}`).toLowerCase(),
			systemId: this.system._id,
			activated: true,
		}));
	}

	checkForUserChangesAndUpdate(idmUser, user) {
		const updateObject = { $set: {} };
		if (user.firstName != idmUser.firstName) {
			updateObject.$set.firstName = idmUser.firstName || ' ';
		}
		if (user.lastName != idmUser.lastName) {
			updateObject.$set.lastName = idmUser.lastName;
		}
		// Updating SchoolId will cause an issue. We need to discuss about it
		if (user.email != idmUser.email) {
			updateObject.$set.email = idmUser.email;
		}
		if (user.ldapDn != idmUser.ldapDn) {
			updateObject.$set.ldapDn = idmUser.ldapDn;
		}

		// Role
		updateObject.$set.roles = idmUser.roles;

		return accountModel.update(
			{ userId: user._id },
			{ username: (`${this.school.ldapSchoolIdentifier}/${idmUser.ldapUID}`).toLowerCase() },
		).then(_ => this.app.service('users').update(
			{ _id: user._id },
			updateObject,
		));
	}

	createClassesFromLdapData(data) {
		const res = Promise.all(data.map(ldapClass => this.getOrCreateClassFromLdapData(ldapClass)
			.then(currentClass => this.populateClassUsers(ldapClass, currentClass))));
		return res;
	}

	getOrCreateClassFromLdapData(data) {
		return this.app.service('classes').find({ query: { ldapDN: data.ldapDn } })
			.then((res) => {
				if (res.total == 0) {
					const newClass = {
						name: data.className,
						schoolId: this.school._id,
						nameFormat: 'static',
						ldapDN: data.ldapDn,
						year: this.school.currentYear,
					};
					return this.app.service('classes').create(newClass);
				}
				return res.data[0];
			});
	}

	populateClassUsers(ldapClass, currentClass) {
		const students = []; const
			teachers = [];
		if (!('uniqueMembers' in ldapClass)) {
			return Promise.resolve();
		}
		if (Array.isArray(ldapClass.uniqueMembers) === false) {
			ldapClass.uniqueMembers = [ldapClass.uniqueMembers];
		}
		return Promise.all(ldapClass.uniqueMembers.map(ldapUserDn => this.app.service('users').find({ query: { ldapDn: ldapUserDn, $populate: ['roles'] } })
			.then((user) => {
				if (user.total > 0) {
					user = user.data[0];
					user.roles.map((role) => {
						if (role.name == 'student') students.push(user._id);
						if (role.name == 'teacher') teachers.push(user._id);
					});
				}
				return Promise.resolve();
			}))).then((_) => {
			if (students.length == 0 && teachers.length == 0) return Promise.resolve();
			return this.app.service('classes').patch(currentClass._id, { $set: { userIds: students, teacherIds: teachers } });
		}).catch(err => Promise.reject(err));
	}
}

module.exports = LDAPSchoolSyncer;
