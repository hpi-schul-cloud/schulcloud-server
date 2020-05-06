const accountModel = require('../../account/model');
const SystemSyncer = require('./SystemSyncer');

/**
 * Implements syncing schools from LDAP servers based on the Syncer interface
 * @class LDAPSyncer
 * @implements {Syncer}
 */
class LDAPSchoolSyncer extends SystemSyncer {
	constructor(app, stats, logger, system, school) {
		super(app, stats, logger, system);
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
			.then((_) => this.getUserData())
			.then((_) => this.getClassData())
			.then((_) => this.stats);
	}

	async getUserData() {
		this.logInfo('Getting users...');
		const ldapUsers = await this.app.service('ldap').getUsers(this.system.ldapConfig, this.school);
		const jobs = ldapUsers.map((idmUser) => async () => this.createOrUpdateUser(idmUser, this.school));
		for (const job of jobs) {
			await job();
		}

		this.logInfo(`Created ${this.stats.users.created} users, `
						+ `updated ${this.stats.users.updated} users. `
						+ `Skipped errors: ${this.stats.users.errors}.`);
	}

	getClassData() {
		this.logInfo('Getting classes...');
		const currentSchool = this.school;
		return this.app.service('ldap').getClasses(this.system.ldapConfig, currentSchool)
			.then((data) => {
				this.logInfo('Creating classes');
				return this.createClassesFromLdapData(data, currentSchool);
			});
	}

	createOrUpdateUser(idmUser) {
		return this.app.service('users').find({
			query: {
				ldapId: idmUser.ldapUUID,
			},
		}).then((users) => {
			if (users.total !== 0) {
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
		}).then((registrationPin) => this.app.service('users').create({
			pin: registrationPin.pin,
			firstName: idmUser.firstName,
			lastName: idmUser.lastName,
			schoolId: this.school._id,
			email: idmUser.email,
			ldapDn: idmUser.ldapDn,
			ldapId: idmUser.ldapUUID,
			roles: idmUser.roles,
		})).then((user) => accountModel.create({
			userId: user._id,
			username: (`${this.school.ldapSchoolIdentifier}/${idmUser.ldapUID}`).toLowerCase(),
			systemId: this.system._id,
			activated: true,
		}));
	}

	checkForUserChangesAndUpdate(idmUser, user) {
		const updateObject = {};
		if (user.firstName !== idmUser.firstName) {
			updateObject.firstName = idmUser.firstName || ' ';
		}
		if (user.lastName !== idmUser.lastName) {
			updateObject.lastName = idmUser.lastName;
		}
		// Updating SchoolId will cause an issue. We need to discuss about it
		if (user.email !== idmUser.email) {
			updateObject.email = idmUser.email;
		}
		if (user.ldapDn !== idmUser.ldapDn) {
			updateObject.ldapDn = idmUser.ldapDn;
		}

		// Role
		updateObject.roles = idmUser.roles;

		return accountModel.update(
			{ userId: user._id, systemId: this.system._id },
			{ username: (`${this.school.ldapSchoolIdentifier}/${idmUser.ldapUID}`).toLowerCase() },
		).then((_) => this.app.service('users').patch(
			user._id,
			updateObject,
		));
	}

	createClassesFromLdapData(data, school) {
		const classes = data.filter((d) => 'uniqueMembers' in d && d.uniqueMembers !== undefined);
		const res = Promise.all(classes.map((ldapClass) => this.getOrCreateClassFromLdapData(ldapClass, school)
			.then((currentClass) => this.populateClassUsers(ldapClass, currentClass, school))));
		return res;
	}

	getOrCreateClassFromLdapData(data, school) {
		return this.app.service('classes').find({
			query: {
				// schoolId: school._id, //Could be issue for LDAP with multiple schools
				year: school.currentYear,
				ldapDN: data.ldapDn,
			},
		}).then((res) => {
			if (res.total === 0) {
				const newClass = {
					name: data.className,
					schoolId: this.school._id,
					nameFormat: 'static',
					ldapDN: data.ldapDn,
					year: this.school.currentYear,
				};
				return this.app.service('classes').create(newClass);
			}
			const updateObject = {
				$set: {
					name: data.className,
				},
			};
			this.app.service('classes').update(
				{ _id: res.data[0]._id },
				updateObject,
			);
			return res.data[0];
		});
	}

	async populateClassUsers(ldapClass, currentClass) {
		const students = [];
		const teachers = [];
		if (Array.isArray(ldapClass.uniqueMembers) === false) {
			ldapClass.uniqueMembers = [ldapClass.uniqueMembers];
		}
		const userData = await this.app.service('users').find(
			{
				query:
				{
					ldapDn: { $in: ldapClass.uniqueMembers },
					$populate: ['roles'],
				},
			},
		);
		userData.data.forEach((user) => {
			user.roles.forEach((role) => {
				if (role.name === 'student') students.push(user._id);
				if (role.name === 'teacher') teachers.push(user._id);
			});
		});

		if (students.length > 0 && teachers.length > 0) {
			await this.app.service('classes').patch(
				currentClass._id,
				{ userIds: students, teacherIds: teachers },
			);
		}
		return Promise.resolve();
	}
}

module.exports = LDAPSchoolSyncer;
