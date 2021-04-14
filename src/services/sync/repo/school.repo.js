class SchoolRepo {
	constructor(app) {
		this.app = app;
		this.service = this.app.service('schools');
		this.schoolCache = {};
	}

	create(schoolData) {
		return this.service.create(schoolData);
	}

	updateName(schoolId, schoolName) {
		return this.service.patch({ _id: schoolId }, { name: schoolName });
	}

	async findByLdapIdAndSystem(ldapSchoolIdentifier, systems) {
		const schoolFromCache = this.schoolCache[ldapSchoolIdentifier];
		if (schoolFromCache === undefined) {
			const schools = await this.service.find({
				query: {
					ldapSchoolIdentifier,
					systems: { $in: systems },
				},
			});
			if (schools.total !== 0) {
				const school = schools.data[0];
				if (school !== undefined) {
					this.schoolCache[ldapSchoolIdentifier] = school;
					return Promise.resolve(school);
				}
			}
		}
		schoolFromCache.fromCache = true;
		return Promise.resolve(schoolFromCache);
	}

	cleanCache() {
		this.schoolCache = {};
	}
}

module.exports = SchoolRepo;
