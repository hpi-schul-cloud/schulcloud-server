const { BadRequest } = require('@feathersjs/errors');
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
	context.params.school = await School
		.findById(schoolId)
		.select(['name', 'currentYear', 'inMaintenanceSince', 'inMaintenance'])
		.populate(['currentYear', 'systems'])
		.lean({ virtuals: true })
		.exec();
	return context;
};
