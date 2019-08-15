const { BadRequest } = require('@feathersjs/errors');

const SchoolYearFacade = require('../../school/logic/year');

// private functions

class ClassSuccessorService {
	constructor(app) {
		this.docs = {};
		this.app = app;
	}

	/**
	 * returns suggested data for a successor class in the next year, based on a given class.
	 * The Successor class is NOT created!
	 * @param {ObjectId} id classId
	 * @param {Object} params params object
	 */
	async get(id, params) {
		try {
			const currentClass = await this.app.service('classes').get(id);

			const successor = {
				name: currentClass.name,
				schoolId: currentClass.schoolId,
				teacherIds: currentClass.teacherIds,
				userIds: currentClass.userIds,
			};

			// ToDO warning if gradelevel too high
			if (currentClass.gradeLevel && currentClass.gradeLevel < 12) {
				successor.gradeLevel = currentClass.gradeLevel + 1;
			}

			if (currentClass.year) {
				const school = await (this.app.service('schools').get(currentClass.schoolId));
				const schoolYears = new SchoolYearFacade(school.years.schoolYears, school);
				successor.year = await schoolYears.getNextYearAfter(currentClass.year)._id;
			}

			return successor;
		} catch (err) {
			throw err;
		}
	}

	async find(params) {
		try {
			return [params];
		} catch (err) {
			throw err;
		}
	}
}

module.exports = ClassSuccessorService;
