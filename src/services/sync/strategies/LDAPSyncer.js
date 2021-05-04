const { getChannel } = require('../../../utils/rabbitmq');
const Syncer = require('./Syncer');

const SchoolYearFacade = require('../../school/logic/year.js');

const LDAP_SYNC_ACTIONS = {
	SYNC_USER: 'syncUser',
	SYNC_SCHOOL: 'syncSchool',
	SYNC_CLASSES: 'syncClasses',
};

const LDAP_SYNC_CHANNEL_NAME = 'sync_ldap';

/**
 * Implements syncing from LDAP servers based on the Syncer interface for a
 * given system / LDAP Config
 * @class LDAPSyncer
 * @implements {Syncer}
 */
class LDAPSyncer extends Syncer {
	constructor(app, stats, logger, system, options = {}) {
		super(app, stats, logger);
		this.system = system;
		this.options = options;
		this.stats = Object.assign(this.stats, {
			schools: {},
		});
		this.syncQueue = getChannel(LDAP_SYNC_CHANNEL_NAME, { durable: true });
	}

	prefix() {
		return this.system.alias;
	}

	/**
	 * @see {Syncer#steps}
	 */
	async steps() {
		await super.steps();
		await this.attemptRun();
		const schools = await this.getSchools();
		const userPromises = [];
		for (const school of schools) {
			userPromises.push(this.getUserData(school));
		}
		await Promise.all(userPromises);

		const schoolPromises = [];
		for (const school of schools) {
			schoolPromises.push(this.getClassData(school));
		}
		await Promise.all(schoolPromises);
	}

	async getSchools() {
		const data = await this.app.service('ldap').getSchools(this.system.ldapConfig);
		return this.createSchoolsFromLdapData(data);
	}

	async getCurrentYearAndFederalState() {
		try {
			const years = await this.app.service('years').find();
			const states = await this.app.service('federalStates').find({ query: { abbreviation: 'NI' } });
			if (years.total !== 0 && states.total !== 0) {
				const currentYear = new SchoolYearFacade(years.data).defaultYear;
				const federalState = states.data[0]._id;
				return { currentYear, federalState };
			}

			return {};
		} catch (err) {
			this.logError('Database should contain at least one year and one valid federal state', {
				err,
				syncId: this.syncId,
			});
			return {};
		}
	}

	async createSchoolsFromLdapData(data) {
		this.logInfo(`Got ${data.length} schools from the server`, { syncId: this.syncId });
		const schoolList = [];
		try {
			const { currentYear, federalState } = await this.getCurrentYearAndFederalState();
			for (const ldapSchool of data) {
				try {
					const schoolData = {
						action: LDAP_SYNC_ACTIONS.SYNC_SCHOOL,
						syncId: this.syncId,
						data: {
							school: {
								name: ldapSchool.displayName,
								systems: [this.system._id],
								ldapSchoolIdentifier: ldapSchool.ldapOu,
								currentYear,
								federalState,
							},
						},
					};
					this.syncQueue.sendToQueue(schoolData, {});
					schoolList.push(schoolData.data.school);
				} catch (err) {
					this.logger.error('Uncaught LDAP sync error', { error: err, systemId: this.system._id, syncId: this.syncId });
				}
			}
		} catch (err) {
			this.logger.error('Uncaught LDAP sync error', { error: err, systemId: this.system._id, syncId: this.syncId });
		}
		return schoolList;
	}

	async getUserData(school) {
		this.logInfo(`Getting users for school ${school.name}`, { syncId: this.syncId });
		const ldapUsers = await this.app.service('ldap').getUsers(this.system.ldapConfig, school);
		this.logInfo(`Creating and updating ${ldapUsers.length} users for school ${school.name}`, { syncId: this.syncId });

		const bulkSize = 1000; // 5000 is a hard limit because of definition in user model

		for (let i = 0; i < ldapUsers.length; i += bulkSize) {
			const ldapUserChunk = ldapUsers.slice(i, i + bulkSize);
			for (const ldapUser of ldapUserChunk) {
				try {
					const userData = {
						action: LDAP_SYNC_ACTIONS.SYNC_USER,
						syncId: this.syncId,
						data: {
							user: {
								firstName: ldapUser.firstName,
								lastName: ldapUser.lastName,
								systemId: this.system._id,
								schoolDn: school.ldapSchoolIdentifier,
								email: ldapUser.email,
								ldapDn: ldapUser.ldapDn,
								ldapId: ldapUser.ldapUUID,
								roles: ldapUser.roles,
							},
							account: {
								ldapDn: ldapUser.ldapDn,
								ldapId: ldapUser.ldapUUID,
								username: `${school.ldapSchoolIdentifier}/${ldapUser.ldapUID}`.toLowerCase(),
								systemId: this.system._id,
								schoolDn: school.ldapSchoolIdentifier,
								activated: true,
							},
						},
					};
					this.syncQueue.sendToQueue(userData, {});
				} catch (err) {
					this.logError(`User creation error for ${ldapUser.firstName} ${ldapUser.lastName} (${ldapUser.email})`, {
						err,
						syncId: this.syncId,
					});
				}
			}
		}
	}

	async getClassData(school) {
		this.logInfo(`Getting classes for school ${school.name}`, { syncId: this.syncId });
		const classes = await this.app.service('ldap').getClasses(this.system.ldapConfig, school);
		this.logInfo(`Creating and updating ${classes.length} classes for school ${school.name}`, { syncId: this.syncId });
		for (const ldapClass of classes) {
			try {
				this.pushClassData(ldapClass, school);
			} catch (err) {
				this.logError('Cannot create synced class', { error: err, ldapClass, syncId: this.syncId });
			}
		}
	}

	pushClassData(data, school) {
		const classData = {
			action: LDAP_SYNC_ACTIONS.SYNC_CLASSES,
			syncId: this.syncId,
			data: {
				class: {
					name: data.className,
					systemId: this.system._id,
					schoolDn: school.ldapSchoolIdentifier,
					nameFormat: 'static',
					ldapDN: data.ldapDn,
					year: school.currentYear,
					uniqueMembers: data.uniqueMembers,
				},
			},
		};
		if (!Array.isArray(classData.uniqueMembers)) {
			// if there is only one member, ldapjs doesn't give us an array here
			classData.uniqueMembers = [classData.uniqueMembers];
		}
		this.syncQueue.sendToQueue(classData, {});
	}

	/**
	 * Updates the lastSyncAttempt attribute of the system's ldapConfig.
	 * This is very useful for second-level User-Support.
	 * @async
	 */
	async attemptRun() {
		const now = Date.now();
		this.logger.debug(`Setting system.ldapConfig.lastSyncAttempt = ${now}`, { syncId: this.syncId });
		const update = {
			'ldapConfig.lastSyncAttempt': now,
		};
		await this.app.service('systems').patch(this.system._id, update);
		this.logger.debug('System stats updated.', { syncId: this.syncId });
	}

	/**
	 * Updates relevant attributes of the system's ldapConfig if the sync was successful.
	 * This is necessary for (future) delta syncs and second-level User-Support.
	 * @async
	 */
	async persistRun() {
		this.logger.debug('System-Sync done. Updating system stats...', { syncId: this.syncId });
		if (this.successful()) {
			const update = {};
			if (this.stats.modifyTimestamp) {
				update['ldapConfig.lastModifyTimestamp'] = this.stats.modifyTimestamp; // requirement for next delta sync
			}

			// The following is not strictly necessary for delta sync, but very handy for the second-level
			// User-Support:
			const now = Date.now();
			if (this.options.forceFullSync || !this.system.ldapConfig.lastModifyTimestamp) {
				// if there is no lastModifyTimestamp present, this must have been a full sync
				update['ldapConfig.lastSuccessfulFullSync'] = now;
			} else {
				update['ldapConfig.lastSuccessfulPartialSync'] = now;
			}

			this.logger.debug(`Setting these values: ${JSON.stringify(update)}.`, { syncId: this.syncId });
			await this.app.service('systems').patch(this.system._id, update);
			this.logger.debug('System stats updated.', { syncId: this.syncId });
		} else {
			// The sync attempt was persisted before the run (see #attemptRun) in order to
			// record the run even if there are uncaught errors. Nothing to do here...
			this.logger.debug('Not successful. Skipping...', { syncId: this.syncId });
		}
	}
}

module.exports = {
	LDAPSyncer,
	LDAP_SYNC_ACTIONS,
	LDAP_SYNC_CHANNEL_NAME,
};
