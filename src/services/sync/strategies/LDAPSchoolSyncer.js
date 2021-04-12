const moment = require('moment');
const accountModel = require('../../account/model');
const Syncer = require('./Syncer');
const { dateToLdapTimestamp } = require('../../ldap/strategies/deltaSyncUtils');

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
			// these dates are used for forcing full sync
			delete this.system.ldapConfig.lastModifyTimestamp;
			delete this.school.ldapLastSync;
		}
		this.stats = Object.assign(this.stats, {
			startTimestamp: moment.utc().toDate(),
			modifyTimestamp: this.school.ldapLastSync || '0',
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
		await this.updateTimestamps();
		return this.stats;
	}

	async getUserData() {
		this.logInfo(`Getting users for school ${this.school.name}`, { syncId: this.syncId });
		const ldapUsers = await this.app.service('ldap').getUsers(this.system.ldapConfig, this.school);
		this.logInfo(`Creating and updating ${ldapUsers.length} users for school ${this.school.name}`, {
			syncId: this.syncId,
		});

		const bulkSize = 1000; // 5000 is a hard limit because of definition in user model

		for (let i = 0; i < ldapUsers.length; i += bulkSize) {
			const ldapUserChunk = ldapUsers.slice(i, i + bulkSize);
			const ldapUserIds = ldapUserChunk.map((ldapUser) => ldapUser.ldapUUID);
			// eslint-disable-next-line no-await-in-loop
			const userData = await this.app.service('usersModel').find({
				query: {
					ldapId: { $in: ldapUserIds },
					schoolId: this.school._id,
					$populate: ['roles'],
					$limit: bulkSize, // needed for bulkSize > 1000 because of default limit
				},
			});

			for (const ldapUser of ldapUserChunk) {
				try {
					const dbUser = userData.data.find((userToFind) => userToFind.ldapId === ldapUser.ldapUUID);
					if (dbUser) {
						// eslint-disable-next-line no-await-in-loop
						await this.checkForUserChangesAndUpdate(ldapUser, dbUser);
						this.stats.users.updated += 1;
					} else {
						// eslint-disable-next-line no-await-in-loop
						await this.createUserAndAccount(ldapUser);
						this.stats.users.created += 1;
					}
				} catch (err) {
					this.stats.users.errors += 1;
					this.stats.errors.push(err);
					this.logError(`User creation error for ${ldapUser.firstName} ${ldapUser.lastName} (${ldapUser.email})`, {
						err,
						syncId: this.syncId,
					});
				}
			}
		}

		this.logInfo(
			`Created ${this.stats.users.created} users, ` +
				`updated ${this.stats.users.updated} users. ` +
				`Skipped errors: ${this.stats.users.errors}.`,
			{ syncId: this.syncId }
		);
	}

	async getClassData() {
		this.logInfo(`Getting classes for school ${this.school.name}`);
		const classes = await this.app.service('ldap').getClasses(this.system.ldapConfig, this.school);
		this.logInfo(`Creating and updating ${classes.length} classes for school ${this.school.name}`);
		await this.createClassesFromLdapData(classes, this.school);
		this.logInfo(
			`Created ${this.stats.classes.created} classes, ` +
				`updated ${this.stats.classes.updated} classes. ` +
				`Skipped errors: ${this.stats.classes.errors}.`,
			{ syncId: this.syncId }
		);
	}

	async updateTimestamps() {
		this.logInfo('Persisting school ldap sync timestamp...', { syncId: this.syncId });
		await this.app
			.service('schools')
			.patch(this.school._id, { ldapLastSync: dateToLdapTimestamp(this.stats.startTimestamp) });
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
		// userMap is shared over all calls of populateClassUsers and will contain all users that are loaded while populating the classes
		// so if user are in multiple classes they will only be loaded once
		const userMap = new Map();
		for (const ldapClass of data) {
			try {
				// eslint-disable-next-line no-await-in-loop
				const klass = await this.getOrCreateClassFromLdapData(ldapClass, school);
				// eslint-disable-next-line no-await-in-loop
				await this.populateClassUsers(ldapClass, klass, userMap);
			} catch (err) {
				this.stats.classes.errors += 1;
				this.stats.errors.push(err);
				this.logError('Cannot create synced class', { error: err, data, syncId: this.syncId });
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

	async populateClassUsers(ldapClass, currentClass, userMap) {
		const students = [];
		const teachers = [];

		const addUserToRoleGroup = (dbUser) => {
			dbUser.roles.forEach((role) => {
				if (role.name === 'student') students.push(dbUser._id);
				if (role.name === 'teacher') teachers.push(dbUser._id);
			});
		};

		if (ldapClass.uniqueMembers === undefined) {
			// no members means nothing to do here
			return;
		}
		if (!Array.isArray(ldapClass.uniqueMembers)) {
			// if there is only one member, ldapjs doesn't give us an array here
			ldapClass.uniqueMembers = [ldapClass.uniqueMembers];
		}

		// Some users are already in userMap. We don't need to load them again from DB.
		// We load only users that are missing and add them to the map to not load them again for another class.
		const usersMissingInMap = [];
		ldapClass.uniqueMembers.forEach((member) => {
			const dbUser = userMap.get(member);
			if (dbUser) {
				addUserToRoleGroup(dbUser);
			} else {
				usersMissingInMap.push(member);
			}
		});
		const userData = await this.app.service('usersModel').find({
			query: {
				ldapDn: { $in: usersMissingInMap },
				$populate: ['roles'],
				$select: ['_id', 'roles', 'ldapDn'],
			},
		});
		userData.data.forEach((dbUser) => {
			userMap.set(dbUser.ldapDn, dbUser);
			addUserToRoleGroup(dbUser);
		});

		if (students.length > 0 || teachers.length > 0) {
			await this.app.service('classes').patch(currentClass._id, { userIds: students, teacherIds: teachers });
		}
	}
}

module.exports = LDAPSchoolSyncer;
