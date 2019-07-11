const hooks = require('./hooks/maintenance');
const { schoolModel: School } = require('./model');

const schoolUsesLdap = school => school.systems.some(s => s.type === 'ldap');
const getStatus = school => ({
	currentYear: school.currentYear,
	schoolUsesLdap: schoolUsesLdap(school),
	maintenance: {
		active: school.inMaintenance,
		startDate: school.inMaintenanceSince,
	},
});

const determineNextYear = year => year;

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
	 * Enter transfer period (LDAP) or migrate school to next school year (non-LDAP)
	 *
	 * @param {Object} data unused
	 * @param {Object} params feathers request params
	 * @returns Object {currentYear, schoolUsesLdap, maintenance: {active, startDate}}
	 * @memberof SchoolMaintenanceService
	 */
	async create(data, params) {
		let { school } = params;
		const patch = {};
		if (schoolUsesLdap(school)) {
			patch.inMaintenanceSince = Date.now();
		} else {
			patch.currentYear = determineNextYear(school.currentYear);
			patch.$unset = { inMaintenanceSince: '' };
		}
		school = await School.findOneAndUpdate({ _id: school._id }, patch, { new: true });
		return Promise.resolve(getStatus(school));
	}

	update(id, data, params) {
		return Promise.resolve({
			purpose: '(UPDATE) nicht-ldap: ins neue Jahr setzen / ldap: transferphase beenden und ins neue Jahr setzen',
			currentYear: {
				_id: '42',
				name: '2019/20',
			},
		});
	}
}

module.exports = {
	SchoolMaintenanceService,
};
