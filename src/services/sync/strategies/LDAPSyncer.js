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
		const schools = await this.getSchools();
		const userPromises = [];
		for (const school of schools) {
			userPromises.push(this.sendUserData(school));
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

	async getUsers(school) {
		this.logInfo(`Getting users for school ${school.name}`, { syncId: this.syncId });
		const ldapUsers = await this.app.service('ldap').getUsers(this.system.ldapConfig, school);
		return this.sendUserData(ldapUsers, school.ldapSchoolIdentifier);
	}

	async getCurrentYearAndFederalState() {
		try {
			const years = await this.app.service('years').find();
			const states = await this.app.service('federalStates').find({ query: { abbreviation: 'NI' } });
			if (years.total !== 0 && states.total !== 0) {
				const currentYear = new SchoolYearFacade(years.data).defaultYear;
				const stateID = states.data[0]._id;
				return { currentYear, stateID };
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

	createSyncMessage(action, data) {
		return {
			syncId: this.syncId,
			action,
			data,
		};
	}

	createSchoolDataForMessage({ schoolName, ldapSchoolIdentifier, currentYear, federalState }) {
		return {
			school: {
				name: schoolName,
				systems: [this.system._id],
				ldapSchoolIdentifier,
				currentYear,
				federalState,
			},
		};
	}

	async createSchoolsFromLdapData(data) {
		this.logInfo(`Got ${data.length} schools from the server`, { syncId: this.syncId });
		const schoolList = [];
		try {
			const { currentYear, federalState } = await this.getCurrentYearAndFederalState();
			for (const ldapSchool of data) {
				try {
					const schoolData = this.createSchoolDataForMessage({
						schoolName: ldapSchool.displayName,
						ldapSchoolIdentifier: ldapSchool.ldapOu,
						currentYear,
						federalState,
					});
					const schoolMessage = this.createSyncMessage(LDAP_SYNC_ACTIONS.SYNC_SCHOOL, schoolData);
					this.syncQueue.sendToQueue(schoolMessage, {});
					schoolList.push(schoolData.school);
				} catch (err) {
					this.logger.error('Uncaught LDAP sync error', { error: err, systemId: this.system._id, syncId: this.syncId });
				}
			}
		} catch (err) {
			this.logger.error('Uncaught LDAP sync error', { error: err, systemId: this.system._id, syncId: this.syncId });
		}
		return schoolList;
	}

	createUserDataForMessage(ldapUser, schoolDn) {
		const { firstName, lastName, email, ldapDn, ldapUUID: ldapId, ldapUID, roles } = ldapUser;
		return {
			user: {
				firstName,
				lastName,
				systemId: this.system._id,
				schoolDn,
				email,
				ldapDn,
				ldapId,
				roles,
			},
			account: {
				ldapDn,
				ldapId,
				username: `${schoolDn}/${ldapUID}`.toLowerCase(),
				systemId: this.system._id,
				schoolDn,
				activated: true,
			},
		};
	}

	async sendUserData(ldapUsers, ldapSchoolIdentifier) {
		this.logInfo(`Processing ${ldapUsers.length} users for school ${ldapSchoolIdentifier}`, { syncId: this.syncId });

		const bulkSize = 1000; // 5000 is a hard limit because of definition in user model

		for (let i = 0; i < ldapUsers.length; i += bulkSize) {
			const ldapUserChunk = ldapUsers.slice(i, i + bulkSize);
			for (const ldapUser of ldapUserChunk) {
				try {
					const userData = this.createUserDataForMessage(ldapUser, ldapSchoolIdentifier);
					const userMessage = this.createSyncMessage(LDAP_SYNC_ACTIONS.SYNC_USER, userData);
					this.syncQueue.sendToQueue(userMessage, {});
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
				this.sendClassData(ldapClass, school);
			} catch (err) {
				this.logError('Cannot create synced class', { error: err, ldapClass, syncId: this.syncId });
			}
		}
	}

	sendClassData(data, school) {
		// if there is only one member, ldapjs doesn't give us an array here
		const { uniqueMembers } = data;

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
					uniqueMembers: Array.isArray(uniqueMembers) ? uniqueMembers : [uniqueMembers],
				},
			},
		};

		this.syncQueue.sendToQueue(classData, {});
	}
}

module.exports = {
	LDAPSyncer,
	LDAP_SYNC_ACTIONS,
	LDAP_SYNC_CHANNEL_NAME,
};
