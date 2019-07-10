class SchoolMaintenanceService {
	setup(app) {
		this.app = app;
	}

	find(params) {
		return Promise.resolve({
			purpose: '(GET) aktueller status (transferphase ja/nein, ldap)',
			schoolUsesLdap: false,
			maintenance: {
				active: true,
				starts: Date.now(),
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
