const { Configuration } = require('@hpi-schul-cloud/commons');
const { getChannel } = require('../../../utils/rabbitmq');
const Syncer = require('./Syncer');
const SchoolYearFacade = require('../../school/logic/year');
const { SyncMessageBuilder } = require('./SyncMessageBuilder');
const { SchoolRepo } = require('../repo');
const { syncLogger } = require('../../../logger/syncLogger');

const LDAP_SYNC_CHANNEL_NAME = Configuration.get('SYNC_QUEUE_NAME');

/**
 * Implements syncing from LDAP servers based on the Syncer interface for a
 * given system / LDAP Config
 * @class LDAPSyncer
 * @implements {Syncer}
 */
class LDAPSyncer extends Syncer {
	constructor(app, stats = {}, logger, system, syncQueue, options = {}) {
		super(app, stats, logger);
		this.system = system;
		this.options = options;
		this.stats = Object.assign(stats, {
			schools: 0,
			users: 0,
			classes: 0,
		});
		this.syncQueue = syncQueue;
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
		const ldapSchools = await this.ldapService.getSchools(this.system.ldapConfig);
		this.stats.schools += ldapSchools.length;
		const years = await SchoolRepo.getYears();
		const currentYear = new SchoolYearFacade(years).defaultYear;
		const federalState = await SchoolRepo.findFederalState('NI');
		return this.sendLdapSchools(ldapSchools, currentYear._id, federalState._id);
	}

	async processLdapUsers(school) {
		syncLogger.info(`Getting users for school ${school.name}`, { syncId: this.syncId });
		const ldapUsers = await this.ldapService.getUsers(this.system.ldapConfig, school);
		this.stats.users += ldapUsers.length;
		await this.sendLdapUsers(ldapUsers, school.ldapSchoolIdentifier);
	}

	async processLdapClasses(school) {
		syncLogger.info(`Getting classes for school ${school.name}`, { syncId: this.syncId });
		const ldapClasses = await this.ldapService.getClasses(this.system.ldapConfig, school);
		this.stats.classes += ldapClasses.length;
		await this.sendLdapClasses(ldapClasses, school);
	}

	async sendLdapSchools(ldapSchools, currentYear, federalState) {
		syncLogger.info(`Got ${ldapSchools.length} schools from the server`, { syncId: this.syncId });
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
			syncLogger.error('Uncaught LDAP sync error', { error: err, systemId: this.system._id, syncId: this.syncId });
			return undefined;
		}
	}

	sendLdapUsers(ldapUsers, ldapSchoolIdentifier) {
		syncLogger.info(`Processing ${ldapUsers.length} users for school ${ldapSchoolIdentifier}`, { syncId: this.syncId });
		ldapUsers.forEach((ldapUser) => this.sendLdapUser(ldapUser, ldapSchoolIdentifier));
	}

	sendLdapUser(ldapUser, ldapSchoolIdentifier) {
		try {
			const userMessage = this.messageBuilder.createUserDataMessage(ldapUser, ldapSchoolIdentifier);
			this.syncQueue.sendToQueue(userMessage, {});
		} catch (err) {
			syncLogger.error(`User creation error for ${ldapUser.firstName} ${ldapUser.lastName} (${ldapUser.email})`, {
				err,
				syncId: this.syncId,
			});
		}
	}

	sendLdapClasses(classes, school) {
		syncLogger.info(`Creating and updating ${classes.length} classes for school ${school.ldapSchoolIdentifier}`, {
			syncId: this.syncId,
		});
		classes.forEach((ldapClass) => this.sendLdapClass(ldapClass, school));
	}

	sendLdapClass(ldapClass, school) {
		try {
			const classMessage = this.messageBuilder.createClassDataMessage(ldapClass, school);
			this.syncQueue.sendToQueue(classMessage, {});
		} catch (err) {
			syncLogger.error('Cannot create synced class', { error: err, ldapClass, syncId: this.syncId });
		}
	}
}

module.exports = {
	LDAPSyncer,
	LDAP_SYNC_CHANNEL_NAME,
};
