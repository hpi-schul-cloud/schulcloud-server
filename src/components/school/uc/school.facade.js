const schoolUc = require('./school.uc');

class SchoolFacade {
	async getSchool(id) {
		// TODO check permission
		return schoolUc.getSchool(id);
	}

	async getTombstoneSchool() {
		return schoolUc.getTombstoneSchool();
	}

	async updateSchool(schoolId, schoolPatch, user) {
		schoolUc.checkPermissions(schoolId, 'SCHOOL_EDIT', user);
		return schoolUc.updateSchool(schoolId, schoolPatch);
	}
}

module.exports = function setupSchoolFacade(app) {
	app.registerFacade('/school/v2', new SchoolFacade(app));
};
