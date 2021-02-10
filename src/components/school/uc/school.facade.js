const schoolUc = require('./school.uc');
const { checkPermissions } = require('../../helper/uc.helper');
const storageProvider = require('../../../services/storageProvider');

class SchoolFacade {
	async getSchool(id) {
		return schoolUc.getSchool(id);
	}

	async getTombstoneSchool() {
		return schoolUc.getTombstoneSchool();
	}

	async setTombstoneUser(currentUser, schoolId, tombstoneUserId) {
		checkPermissions(currentUser, schoolId, ['STUDENT_DELETE', 'TEACHER_DELETE'], 'OR');
		return schoolUc.setTombstoneUser(schoolId, tombstoneUserId);
	}

	async setStorageProvider(schoolId, storageProviderId, session) {
		return schoolUc.setStorageProvider(schoolId, storageProviderId, session);
	}
}

module.exports = function setupSchoolFacade(app) {
	app.registerFacade('/school/v2', new SchoolFacade(app));
};
