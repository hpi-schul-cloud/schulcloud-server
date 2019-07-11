const hooks = require('./hooks/maintenance');

const schoolUsesLdap = params => params.school.systems.some(s => s.type === 'ldap');

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
	 * @returns Object {schoolUsesLdap, maintenance: {active, startDate}}
	 * @memberof SchoolMaintenanceService
	 */
	async find(params) {
		return Promise.resolve({
			schoolUsesLdap: schoolUsesLdap(params),
			maintenance: {
				active: params.school.inMaintenance,
				startDate: params.school.inMaintenanceSince,
			},
		});
	}

	create(data, params) {
		return Promise.resolve({
			purpose: '(POST) nicht-ldap: ins neue Jahr setzen / ldap: transferphase starten',
			currentYear: {
				_id: '42',
				name: '2019/20',
			},
		});
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
