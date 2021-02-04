const { NotFound, BadRequest } = require('../../../errors');
const { schoolModel: School } = require('../model');

/**
 * Add school object referenced in route to params
 *
 * @example `/schools/23bd1/subRoute` => params: { school: { _id: 23bd1, name: 'Testschule', ... } }
 */
module.exports = async (context) => {
	if (!context.params || !context.params.route) {
		throw new BadRequest('Missing request params');
	}
	const { schoolId } = context.params.route;
	try {
		context.params.school = await School.findById(schoolId)
			.select([
				'name',
				'currentYear',
				'inMaintenanceSince',
				'inMaintenance',
				'enableStudentTeamCreation',
				'language',
				'timezone',
			])
			.populate(['currentYear', 'systems'])
			.lean({ virtuals: true })
			.exec();
	} catch (err) {
		throw new NotFound('School not found', err);
	}
	return context;
};
