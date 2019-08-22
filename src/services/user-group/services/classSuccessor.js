const { BadRequest } = require('@feathersjs/errors');

const SchoolYearFacade = require('../../school/logic/year');
const logger = require('../../../logger');
const { classModel } = require('../model');

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
			if (currentClass.gradeLevel) {
				if (currentClass.gradeLevel >= 13) {
					throw new BadRequest('there is no grade level higher than 13!');
				}
				successor.gradeLevel = currentClass.gradeLevel + 1;
			}

			if (currentClass.year) {
				const school = await (this.app.service('schools').get(currentClass.schoolId));
				const schoolYears = new SchoolYearFacade(school.years.schoolYears, school);
				successor.year = await schoolYears.getNextYearAfter(currentClass.year)._id;
			}

			const query = { $and: [{ name: successor.name }] };
			query.$and.push(
				successor.gradeLevel ? { gradeLevel: successor.gradeLevel } : { gradeLevel: { $exists: false } }
			);
			query.$and.push(
				successor.year ? { year: successor.year } : { year: { $exists: false } },
			);
			// for some reason this only works via the model, the service always returns all classes on the school.
			// eventually, this should go over the service
			const duplicatesResponse = await classModel.find(query);
			successor.duplicates = duplicatesResponse.map(c => c._id);

			return successor;
		} catch (err) {
			logger.warning(err);
			throw err;
		}
	}

	async find(params) {
		try {
			if (!((params.query || {}).classIds && Array.isArray(params.query.classIds))) {
				throw new BadRequest('please pass an array of classIds in query.classIds');
			}

			return params.query.classIds.map(classId => this.get(classId));
		} catch (err) {
			logger.warning(err);
			throw err;
		}
	}
}

module.exports = ClassSuccessorService;
