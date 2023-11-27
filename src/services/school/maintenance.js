const hooks = require('./hooks/maintenance.hooks');
const { schoolModel: School, yearModel: Years } = require('./model');
const SchoolYearFacade = require('./logic/year');

const ldapSystemFilter = (s) => s.type === 'ldap' && s.ldapConfig && s.ldapConfig.active === true;

const schoolUsesLdap = (school) => (school.systems || []).some(ldapSystemFilter);

class SchoolMaintenanceService {
	setup(app) {
		this.app = app;
		this.hooks(hooks);
	}

	/**
	 * Returns the next school year for a given school
	 * @param {School} school
	 * @returns {Year} the next school year
	 * @memberof SchoolMaintenanceService
	 */
	async determineNextYear(school) {
		const years = await Years.find().lean().exec();
		const facade = new SchoolYearFacade(years, school);
		return facade.getNextYearAfter(school.currentYear._id);
	}

	/**
	 * Returns the maintenance status for a given school
	 * @param {School} school
	 * @returns {Object} { currentYear, nextYear, schoolUsesLdap, maintenance: { active, startDate } }
	 * @memberof SchoolMaintenanceService
	 */
	async getStatus(school) {
		const maintenanceStatus = {
			currentYear: school.currentYear,
			nextYear: await this.determineNextYear(school),
			schoolUsesLdap: schoolUsesLdap(school),
			maintenance: {
				active: school.inMaintenance,
				startDate: school.inMaintenanceSince,
			},
		};
		if (school.inUserMigration) {
			maintenanceStatus.schoolUsesLdap = false;
			maintenanceStatus.maintenance.active = false;
			maintenanceStatus.maintenance.startDate = undefined;
		}
		return maintenanceStatus;
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
		const bumpYear = async () => {
			patch.currentYear = await this.determineNextYear(school);
			patch.$unset = { inMaintenanceSince: '' };
		};
		if (data.maintenance === true) {
			if (schoolUsesLdap(school)) {
				patch.inMaintenanceSince = Date.now();
			} else {
				await bumpYear();
			}
		} else if (data.maintenance === false && school.inMaintenance) {
			await bumpYear();
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
