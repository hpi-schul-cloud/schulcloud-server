class ClassRepo {
	constructor(app) {
		this.app = app;
		this.service = this.app.service('classes');
	}

	findByYearAndLdapDn(year, ldapDN) {
		return this.service.find({
			query: {
				year,
				ldapDN,
			},
		});
	}

	create(newClass) {
		return this.service.create(newClass);
	}

	updateName(classId, className) {
		return this.service.patch(classId, { name: className });
	}
}

module.exports = ClassRepo;
