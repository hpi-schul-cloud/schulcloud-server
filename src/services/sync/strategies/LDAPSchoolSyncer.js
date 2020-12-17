const accountModel = require('../../account/model');
const Syncer = require('./Syncer');

/**
 * Implements syncing schools from LDAP servers based on the Syncer interface
 * @class LDAPSyncer
 * @implements {Syncer}
 */
class LDAPSchoolSyncer extends Syncer {
	constructor(app, stats, logger, system, school, options = {}) {
		super(app, stats, logger);
		this.system = system;
		this.school = school;
		this.options = options;
		if (options.forceFullSync) {
			delete this.system.ldapConfig.lastModifyTimestamp;
		}
		this.stats = Object.assign(this.stats, {
			modifyTimestamp: this.system.ldapConfig.lastModifyTimestamp || '0',
			name: this.school.name,
			users: {
				created: 0,
				updated: 0,
				errors: 0,
			},
			classes: {
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
		return `${this.system.alias} | ${this.school.name}`;
	}

	/**
	 * @see {Syncer#steps}
	 */
	async steps() {
		await super.steps();
		await this.getUserData();
		await this.getClassData();
		return this.stats;
	}

	async getUserData() {
		this.logInfo('Getting users...');
		const ldapUsers = await this.app.service('ldap').getUsers(this.system.ldapConfig, this.school);
		this.logInfo(`Creating and updating ${ldapUsers.length} users...`);
		for (const ldapUser of ldapUsers) {
			// eslint-disable-next-line no-await-in-loop
			await this.createOrUpdateUser(ldapUser);
			this.updateModifyTimestampMaximum(ldapUser.modifyTimestamp);
		}

		this.logInfo(
			`Created ${this.stats.users.created} users, ` +
				`updated ${this.stats.users.updated} users. ` +
				`Skipped errors: ${this.stats.users.errors}.`
		);
	}

	async getClassData() {
		this.logInfo('Getting classes...');
		const classes = await this.app.service('ldap').getClasses(this.system.ldapConfig, this.school);
		this.logInfo(`Creating and updating ${classes.length} classes...`);
		await this.createClassesFromLdapData(classes, this.school);
		this.logInfo(
			`Created ${this.stats.classes.created} classes, ` +
				`updated ${this.stats.classes.updated} classes. ` +
				`Skipped errors: ${this.stats.classes.errors}.`
		);
	}

	updateModifyTimestampMaximum(date) {
		if (date && this.stats.modifyTimestamp < date) this.stats.modifyTimestamp = date;
	}

	createOrUpdateUser(idmUser) {
		return this.app
			.service('usersModel')
			.find({
				query: {
					ldapId: idmUser.ldapUUID,
				},
			})
			.then((users) => {
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
						this.stats.errors.push(err);
						this.logError('User creation error', err);
						return {};
					});
			});
	}

	createUserAndAccount(idmUser) {
		return this.app
			.service('users')
			.create({
				firstName: idmUser.firstName,
				lastName: idmUser.lastName,
				schoolId: this.school._id,
				email: idmUser.email,
				ldapDn: idmUser.ldapDn,
				ldapId: idmUser.ldapUUID,
				roles: idmUser.roles,
			})
			.then((user) =>
				accountModel.create({
					userId: user._id,
					username: `${this.school.ldapSchoolIdentifier}/${idmUser.ldapUID}`.toLowerCase(),
					systemId: this.system._id,
					activated: true,
				})
			);
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

		return accountModel
			.update(
				{ userId: user._id, systemId: this.system._id },
				{
					username: `${this.school.ldapSchoolIdentifier}/${idmUser.ldapUID}`.toLowerCase(),
					userId: user._id,
					systemId: this.system._id,
					activated: true,
				},
				{ upsert: true }
			)
			.then((_) => this.app.service('users').patch(user._id, updateObject));
	}

	async createClassesFromLdapData(data, school) {
		for (const ldapClass of data) {
			try {
				this.updateModifyTimestampMaximum(ldapClass.modifyTimestamp);
				// eslint-disable-next-line no-await-in-loop
				const klass = await this.getOrCreateClassFromLdapData(ldapClass, school);
				// eslint-disable-next-line no-await-in-loop
				await this.populateClassUsers(ldapClass, klass, school);
			} catch (err) {
				this.stats.classes.errors += 1;
				this.stats.errors.push(err);
				this.logError('Cannot create synced class', { error: err, data });
			}
		}
	}

	async getOrCreateClassFromLdapData(data, school) {
		const existingClasses = await this.app.service('classes').find({
			query: {
				year: school.currentYear,
				ldapDN: data.ldapDn,
			},
		});
		if (existingClasses.total === 0) {
			const newClass = {
				name: data.className,
				schoolId: this.school._id,
				nameFormat: 'static',
				ldapDN: data.ldapDn,
				year: this.school.currentYear,
			};
			this.stats.classes.created += 1;
			return this.app.service('classes').create(newClass);
		}

		this.stats.classes.updated += 1;
		const existingClass = existingClasses.data[0];
		if (existingClass.name === data.className) {
			return existingClass;
		}

		return this.app.service('classes').patch(existingClass._id, { name: data.className });
	}

	async populateClassUsers(ldapClass, currentClass) {
		const students = [];
		const teachers = [];
		if (ldapClass.uniqueMembers === undefined) {
			// no members means nothing to do here
			return;
		}
		if (!Array.isArray(ldapClass.uniqueMembers)) {
			// if there is only one member, ldapjs doesn't give us an array here
			ldapClass.uniqueMembers = [ldapClass.uniqueMembers];
		}
		const userData = await this.app.service('usersModel').find({
			query: {
				ldapDn: { $in: ldapClass.uniqueMembers },
				$populate: ['roles'],
			},
		});
		userData.data.forEach((user) => {
			user.roles.forEach((role) => {
				if (role.name === 'student') students.push(user._id);
				if (role.name === 'teacher') teachers.push(user._id);
			});
		});

		if (students.length > 0 || teachers.length > 0) {
			await this.app.service('classes').patch(currentClass._id, { userIds: students, teacherIds: teachers });
		}
		return Promise.resolve();
	}
}

module.exports = LDAPSchoolSyncer;
