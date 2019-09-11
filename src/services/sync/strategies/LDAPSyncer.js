const SystemSyncer = require('./SystemSyncer');
const LDAPSchoolSyncer = require('./LDAPSchoolSyncer');

const SchoolYearFacade = require('../../school/logic/year.js');

/**
 * Implements syncing from LDAP servers based on the Syncer interface for a
 * given system / LDAP Config
 * @class LDAPSyncer
 * @implements {Syncer}
 */
class LDAPSyncer extends SystemSyncer {
	constructor(app, stats, system) {
		super(app, stats, system);
		this.stats = Object.assign(this.stats, {
			schools: {},
		});
	}

	/**
     * @see {Syncer#steps}
     */
	steps() {
		return super.steps()
			.then(() => this.getSchools())
			.then((schools) => {
				const activeSchools = schools.filter((s) => !s.inMaintenance);
				const jobs = activeSchools.map((school) => {
					const syncer = new LDAPSchoolSyncer(this.app, this.getSchoolStats(school), this.system, school);
					return syncer.sync();
				});
				return Promise.all(jobs);
			});
	}

	getSchools() {
		return this.app.service('ldap').getSchools(this.system.ldapConfig)
			.then((data) => this.createSchoolsFromLdapData(data));
	}

	getSchoolStats(school) {
		if (!this.stats.schools[school.ldapSchoolIdentifier]) {
			this.stats.schools[school.ldapSchoolIdentifier] = {};
		}
		return this.stats.schools[school.ldapSchoolIdentifier];
	}

	getCurrentYearAndFederalState() {
		return Promise.all([
			this.app.service('years').find(),
			this.app.service('federalStates').find({ query: { abbreviation: 'NI' } }),
		]).then(([years, states]) => {
			if (years.total === 0 || states.total === 0) {
				return Promise.reject(
					new Error('Database should contain at least one year and one valid federal state'),
				);
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
		return Promise.all(data.map((ldapSchool) => this.app.service('schools').find(
			{
				query:
				{
					ldapSchoolIdentifier: ldapSchool.ldapOu,
				},
			},
		).then((schools) => {
			if (schools.total !== 0) {
				updates += 1;
				if (currentLDAPProvider === 'univention') {
					return this.app.service('schools').update(
						{ _id: schools.data[0]._id },
						{ $set: { name: ldapSchool.displayName } },
					);
				}
				return this.app.service('schools').update(
					{ _id: schools.data[0]._id },
					{ $set: { name: schools.data[0].name } },
				);
			}

			return this.getCurrentYearAndFederalState()
				.then(({ currentYear, federalState }) => {
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
		}))).then((res) => {
			this.logInfo(`Created ${newSchools} new schools and updated ${updates} schools`);
			return Promise.resolve(res);
		});
	}
}

module.exports = LDAPSyncer;
