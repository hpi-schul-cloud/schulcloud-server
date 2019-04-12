'use strict';

const service = require('feathers-mongoose');
const schoolModels = require('./model');
const hooks = require('./hooks');

module.exports = function () {
	const app = this;

	const options = {
		Model: schoolModels.schoolModel,
		paginate: {
			default: 5,
			max: 25
		},
		lean: true
	};

	// Initialize our service with any options it requires
	app.use('/schools', service(options));

	// Get our initialize service to that we can bind hooks
	const schoolService = app.service('/schools');

	// Set up our before hooks
	schoolService.before(hooks.before);

	// Set up our after hooks
	schoolService.after(hooks.after);

	/* year Service */
	app.use('/years', service({
		Model: schoolModels.yearModel,
		paginate: {
			default: 500,
			max: 5000
		}
	}));
	const yearService = app.service('/years');
	yearService.before(hooks.before);
	yearService.after(hooks.after);

	/* gradeLevel Service */
	app.use('/gradeLevels', service({
		Model: schoolModels.gradeLevelModel,
		paginate: {
			default: 500,
			max: 5000
		}
	}));
	const gradeLevelService = app.service('/gradeLevels');
	gradeLevelService.before(hooks.before);
	gradeLevelService.after(hooks.after);
};
