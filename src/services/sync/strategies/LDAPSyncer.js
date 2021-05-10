const { getChannel } = require('../../../utils/rabbitmq');
const Syncer = require('./Syncer');
const SchoolYearFacade = require('../../school/logic/year');
const { SyncMessageBuilder } = require('./SyncMessageBuilder');
const { SchoolRepo } = require('../repo');

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
		this.ldapService = this.app && this.app.service('ldap');
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
		const data = await this.ldapService.getSchools(this.system.ldapConfig);
		const years = await SchoolRepo.getYears();
		const currentYear = new SchoolYearFacade(years).defaultYear;
		const federalState = await SchoolRepo.findFederalState('NI');
		return this.sendLdapSchools(data, currentYear, federalState);
	}

	async processLdapUsers(school) {
		this.logInfo(`Getting users for school ${school.name}`, { syncId: this.syncId });
		const ldapUsers = await this.ldapService.getUsers(this.system.ldapConfig, school);
		await this.sendLdapUsers(ldapUsers, school.ldapSchoolIdentifier);
	}

	async processLdapClasses(school) {
		this.logInfo(`Getting classes for school ${school.name}`, { syncId: this.syncId });
		const classes = await this.ldapService.getClasses(this.system.ldapConfig, school);
		await this.sendLdapClasses(classes, school);
	}

	async sendLdapSchools(ldapSchools, currentYear, federalState) {
		this.logInfo(`Got ${ldapSchools.length} schools from the server`, { syncId: this.syncId });
		return ldapSchools
			.map((ldapSchool) => this.sendLdapSchool(ldapSchool, currentYear, federalState))
			.filter((ldapSchool) => ldapSchool !== undefined);
	}

	sendLdapSchool(ldapSchool, currentYear, federalState) {
		try {
			const schoolMessage = this.messageBuilder.createSchoolDataMessage(ldapSchool, currentYear, federalState);
			this.syncQueue.sendToQueue(schoolMessage, {});
			return schoolMessage.data.school;
		} catch (err) {
			this.logger.error('Uncaught LDAP sync error', { error: err, systemId: this.system._id, syncId: this.syncId });
			return undefined;
		}
	}

	sendLdapUsers(ldapUsers, ldapSchoolIdentifier) {
		this.logInfo(`Processing ${ldapUsers.length} users for school ${ldapSchoolIdentifier}`, { syncId: this.syncId });
		ldapUsers.forEach((ldapUser) => this.sendLdapUser(ldapUser, ldapSchoolIdentifier));
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

	sendLdapClasses(classes, school) {
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
