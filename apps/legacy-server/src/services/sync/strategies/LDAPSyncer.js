const asyncPool = require('tiny-async-pool');
const { Configuration } = require('@hpi-schul-cloud/commons');
const Syncer = require('./Syncer');
const LDAPSchoolSyncer = require('./LDAPSchoolSyncer');

const SchoolYearFacade = require('../../school/logic/year.js');

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
		const activeSchools = schools.filter((s) => !s.inMaintenance);
		const nextSchoolSync = async (school) => {
			try {
				const stats = await new LDAPSchoolSyncer(this.app, {}, this.logger, this.system, school, this.options).sync();
				if (
					!this.stats.modifyTimestamp &&
					(stats.users.updated !== 0 ||
						stats.users.created !== 0 ||
						stats.classes.updated !== 0 ||
						stats.classes.created !== 0) &&
					stats.modifyTimestamp
				) {
					// persist the largest modifyTimestamp of the first updated school for the next delta sync
					this.stats.modifyTimestamp = stats.modifyTimestamp;
				}

				if (stats.success !== true) {
					this.stats.errors.push(`LDAP sync failed for school "${school.name}" (${school._id}).`);
				}
				this.stats.schools[school.ldapSchoolIdentifier] = stats;
			} catch (err) {
				// We need to catch errors here, so that the async pool will not reject early without
				// running all sync processes
				this.logger.error('Uncaught LDAP sync error', { error: err, systemId: this.system._id, schoolId: school._id });
				this.stats.errors.push(
					`LDAP sync failed for school "${school.name}" (${school._id}) with error "${err.message}".`
				);
			}
		};
		const poolSize = Configuration.get('LDAP_SCHOOL_SYNCER_POOL_SIZE');
		this.logger.info(`Running LDAP school sync with pool size ${poolSize}`);
		await asyncPool(poolSize, activeSchools, nextSchoolSync);
		await this.persistRun();
		return this.stats;
	}

	getSchools() {
		return this.app
			.service('ldap')
			.getSchools(this.system.ldapConfig)
			.then((data) => this.createSchoolsFromLdapData(data));
	}

	getCurrentYearAndFederalState() {
		return Promise.all([
			this.app.service('years').find(),
			this.app.service('federalStates').find({ query: { abbreviation: 'NI' } }),
		]).then(([years, states]) => {
			if (years.total === 0 || states.total === 0) {
				return Promise.reject(new Error('Database should contain at least one year and one valid federal state'));
			}
			const currentYear = new SchoolYearFacade(years.data).defaultYear;
			return Promise.resolve({ currentYear, federalState: states.data[0]._id });
		});
	}

	createSchoolsFromLdapData(data) {
		this.logInfo(`Got ${data.length} schools from the server`);
		const currentLDAPProvider = this.system.ldapConfig.provider;
		let newSchools = 0;
		let updates = 0;
		let fails = 0;
		return Promise.all(
			data.map((ldapSchool) =>
				this.app
					.service('schools')
					.find({
						query: {
							ldapSchoolIdentifier: ldapSchool.ldapOu,
						},
					})
					.then((schools) => {
						if (schools.total !== 0) {
							updates += 1;
							if (currentLDAPProvider === 'univention') {
								return this.app
									.service('schools')
									.update({ _id: schools.data[0]._id }, { $set: { name: ldapSchool.displayName } });
							}
							return this.app
								.service('schools')
								.update({ _id: schools.data[0]._id }, { $set: { name: schools.data[0].name } });
						}

						return this.getCurrentYearAndFederalState().then(({ currentYear, federalState }) => {
							const schoolData = {
								name: ldapSchool.displayName,
								systems: [this.system._id],
								ldapSchoolIdentifier: ldapSchool.ldapOu,
								currentYear,
								federalState,
							};
							newSchools += 1;
							return this.app.service('schools').create(schoolData);
						});
					})
					.catch((err) => {
						fails += 1;
						this.logError(`School creation failed for ${ldapSchool.displayName}`, err);
					})
			)
		).then((res) => {
			this.logInfo(`Created ${newSchools} new schools and updated ${updates} schools. ${fails} schools failed`);
			return Promise.resolve(res);
		});
	}

	/**
	 * Updates the lastSyncAttempt attribute of the system's ldapConfig.
	 * This is very useful for second-level User-Support.
	 * @async
	 */
	async attemptRun() {
		const now = Date.now();
		this.logger.debug(`Setting system.ldapConfig.lastSyncAttempt = ${now}`);
		const update = {
			'ldapConfig.lastSyncAttempt': now,
		};
		await this.app.service('systems').patch(this.system._id, update);
		this.logger.debug('System stats updated.');
	}

	/**
	 * Updates relevant attributes of the system's ldapConfig if the sync was successful.
	 * This is necessary for (future) delta syncs and second-level User-Support.
	 * @async
	 */
	async persistRun() {
		this.logger.debug('System-Sync done. Updating system stats...');
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

			this.logger.debug(`Setting these values: ${JSON.stringify(update)}.`);
			await this.app.service('systems').patch(this.system._id, update);
			this.logger.debug('System stats updated.');
		} else {
			// The sync attempt was persisted before the run (see #attemptRun) in order to
			// record the run even if there are uncaught errors. Nothing to do here...
			this.logger.debug('Not successful. Skipping...');
		}
	}
}

module.exports = LDAPSyncer;
