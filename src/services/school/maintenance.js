const hooks = require('./hooks/maintenance.hooks');
const { schoolModel: School, yearModel: Years } = require('./schools.model');
const SchoolYearFacade = require('./logic/year');

const ldapSystemFilter = (s) => s.type === 'ldap' && s.ldapConfig && s.ldapConfig.active === true;

const schoolUsesLdap = (school) => (school.systems || []).some(ldapSystemFilter);

class SchoolMaintenanceService {
	async setup(app) {
		this.app = app;
		this.hooks(hooks);
		this.years = await Years.find().lean().exec();
	}

	/**
	 * Returns the next school year for a given school
	 * @param {School} school
	 * @returns {Year} the next school year
	 * @memberof SchoolMaintenanceService
	 */
	determineNextYear(school) {
		const facade = new SchoolYearFacade(this.years, school);
		return facade.getNextYearAfter(school.currentYear._id);
	}

	/**
	 * Returns the maintenance status for a given school
	 * @param {School} school
	 * @returns {Object} { currentYear, nextYear, schoolUsesLdap, maintenance: { active, startDate } }
	 * @memberof SchoolMaintenanceService
	 */
	getStatus(school) {
		return {
			currentYear: school.currentYear,
			nextYear: this.determineNextYear(school),
			schoolUsesLdap: schoolUsesLdap(school),
			maintenance: {
				active: school.inMaintenance,
				startDate: school.inMaintenanceSince,
			},
		};
	}

	/**
	 * GET /schools/:schoolId/maintenance
	 * Returns the current maintenance status of the given school
	 *
	 * @param {Object} params feathers request params
	 * @returns Object {currentYear, schoolUsesLdap, maintenance: {active, startDate}}
	 * @memberof SchoolMaintenanceService
	 */
	find(params) {
		return Promise.resolve(this.getStatus(params.school));
	}

	/**
	 * POST /schools/:schoolId/maintenance
	 * Enter/exit transfer period (LDAP) or migrate school to next school year (non-LDAP).
	 *
	 * @param {Object} data {maintenance: [true/false]}
	 * @param {Object} params feathers request params
	 * @returns Object {currentYear, schoolUsesLdap, maintenance: {active, startDate}}
	 * @memberof SchoolMaintenanceService
	 */
	async create(data, params) {
		let { school } = params;
		const patch = {};
		const bumpYear = () => {
			patch.currentYear = this.determineNextYear(school);
			patch.$unset = { inMaintenanceSince: '' };
		};
		if (data.maintenance === true) {
			if (schoolUsesLdap(school)) {
				patch.inMaintenanceSince = Date.now();
			} else {
				bumpYear();
			}
		} else if (data.maintenance === false && school.inMaintenance) {
			bumpYear();
		}

		school = await School.findOneAndUpdate({ _id: school._id }, patch, { new: true })
			.select(['name', 'currentYear', 'inMaintenanceSince', 'inMaintenance'])
			.populate(['currentYear', 'systems'])
			.lean({ virtuals: true });
		return Promise.resolve(this.getStatus(school));
	}
}

module.exports = {
	SchoolMaintenanceService,
	schoolUsesLdap,
};
