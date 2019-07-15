const hooks = require('./hooks/maintenance.hooks');
const { schoolModel: School } = require('./model');

const ldapSystemFilter = s => s.type === 'ldap' && s.ldapConfig && s.ldapConfig.active === true;

const schoolUsesLdap = school => school.systems.some(ldapSystemFilter);

const determineNextYear = year => year;

const getStatus = school => ({
	currentYear: school.currentYear,
	nextYear: determineNextYear(school.currentYear),
	schoolUsesLdap: schoolUsesLdap(school),
	maintenance: {
		active: school.inMaintenance,
		startDate: school.inMaintenanceSince,
	},
});

class SchoolMaintenanceService {
	setup(app) {
		this.app = app;
		this.hooks(hooks);
	}

	/**
	 * GET /schools/:schoolId/maintenance
	 * Returns the current maintenance status of the given school
	 *
	 * @param {Object} params feathers request params
	 * @returns Object {currentYear, schoolUsesLdap, maintenance: {active, startDate}}
	 * @memberof SchoolMaintenanceService
	 */
	async find(params) {
		return Promise.resolve(getStatus(params.school));
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
			patch.currentYear = determineNextYear(school.currentYear);
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

		school = await School.findOneAndUpdate({ _id: school._id }, patch, { new: true });
		return Promise.resolve(getStatus(school));
	}
}

module.exports = {
	SchoolMaintenanceService,
};
