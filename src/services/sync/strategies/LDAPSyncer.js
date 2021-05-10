const { getChannel } = require('../../../utils/rabbitmq');
const Syncer = require('./Syncer');
const { SyncMessageBuilder } = require('../utils/SyncMessageBuilder');
const SchoolYearFacade = require('../../school/logic/year.js');
const { executeInChunks } = require('../../../utils/array');

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
		const systemId = this.system && this.system._id;
		this.messageBuilder = new SyncMessageBuilder(this.syncId, systemId);
	}

	prefix() {
		return this.system.alias;
	}

	/**
	 * @see {Syncer#steps}
	 */
	async steps() {
		await super.steps();
		await this.syncQueue.getChannel();
		const schools = await this.processLdapSchools();
		await Promise.all(schools.map((school) => this.processLdapUsers(school)));
		await Promise.all(schools.map((school) => this.processLdapClasses(school)));
	}

	async processLdapSchools() {
		const data = await this.app.service('ldap').getSchools(this.system.ldapConfig);
		return this.createSchoolsFromLdapData(data);
	}

	async getCurrentYearAndFederalState() {
		let currentYear;
		let federalState;
		try {
			const years = await this.app.service('years').find();
			// TODO: change federal state for other LDAPs
			const states = await this.app.service('federalStates').find({ query: { abbreviation: 'NI' } });
			if (years.total !== 0 && states.total !== 0) {
				currentYear = new SchoolYearFacade(years.data).defaultYear;
				federalState = states.data[0]._id;
			}
		} catch (err) {
			this.logError('Database should contain at least one year and one valid federal state', {
				err,
				syncId: this.syncId,
			});
		}
		return { currentYear, federalState };
	}

	async createSchoolsFromLdapData(ldapSchools) {
		this.logInfo(`Got ${ldapSchools.length} schools from the server`, { syncId: this.syncId });
		const { currentYear, federalState } = await this.getCurrentYearAndFederalState();
		return ldapSchools
			.map((ldapSchool) => this.sendSchoolData(ldapSchool, currentYear, federalState))
			.filter((ldapSchool) => ldapSchool !== undefined);
	}

	sendSchoolData(ldapSchool, currentYear, federalState) {
		try {
			const schoolMessage = this.messageBuilder.createSchoolDataMessage({
				schoolName: ldapSchool.displayName,
				ldapSchoolIdentifier: ldapSchool.ldapOu,
				currentYear,
				federalState,
			});
			this.syncQueue.sendToQueue(schoolMessage, {});
			return schoolMessage.data.school;
		} catch (err) {
			this.logger.error('Uncaught LDAP sync error', { error: err, systemId: this.system._id, syncId: this.syncId });
			return undefined;
		}
	}

	async processLdapUsers(school) {
		this.logInfo(`Getting users for school ${school.name}`, { syncId: this.syncId });
		const ldapUsers = await this.app.service('ldap').getUsers(this.system.ldapConfig, school);
		await this.sendLdapUsers(ldapUsers, school.ldapSchoolIdentifier);
	}

	async sendLdapUsers(ldapUsers, ldapSchoolIdentifier) {
		this.logInfo(`Processing ${ldapUsers.length} users for school ${ldapSchoolIdentifier}`, { syncId: this.syncId });

		const chunkSize = 1000; // 5000 is a hard limit because of definition in user model
		executeInChunks(ldapUsers, chunkSize, (ldapUser) => this.sendLdapUser(ldapUser, ldapSchoolIdentifier));
	}

	sendLdapUser(ldapUser, ldapSchoolIdentifier) {
		try {
			const userMessage = this.messageBuilder.createUserDataMessage(ldapUser, ldapSchoolIdentifier);
			this.syncQueue.sendToQueue(userMessage, {});
		} catch (err) {
			this.logError(`User creation error for ${ldapUser.firstName} ${ldapUser.lastName} (${ldapUser.email})`, {
				err,
				syncId: this.syncId,
			});
		}
	}

	async processLdapClasses(school) {
		this.logInfo(`Getting classes for school ${school.name}`, { syncId: this.syncId });
		const classes = await this.app.service('ldap').getClasses(this.system.ldapConfig, school);
		await this.sendLdapClasses(classes, school);
	}

	async sendLdapClasses(classes, school) {
		this.logInfo(`Creating and updating ${classes.length} classes for school ${school.ldapSchoolIdentifier}`, {
			syncId: this.syncId,
		});
		classes.forEach((ldapClass) => this.sendLdapClass(ldapClass, school));
	}

	sendLdapClass(ldapClass, school) {
		try {
			const classMessage = this.messageBuilder.createClassDataMessage(ldapClass, school);
			this.syncQueue.sendToQueue(classMessage, {});
		} catch (err) {
			this.logError('Cannot create synced class', { error: err, ldapClass, syncId: this.syncId });
		}
	}
}

module.exports = {
	LDAPSyncer,
	LDAP_SYNC_ACTIONS,
	LDAP_SYNC_CHANNEL_NAME,
};
