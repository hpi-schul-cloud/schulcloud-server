const service = require('feathers-mongoose');
const schoolModels = require('./model');
const hooks = require('./hooks');
const schoolGroupHooks = require('./hooks/schoolGroup.hooks');
const { SchoolMaintenanceService } = require('./maintenance');

module.exports = function schoolServices() {
	const app = this;

	const options = {
		Model: schoolModels.schoolModel,
		paginate: {
			default: 5,
			max: 25,
		},
		lean: {
			virtuals: true,
		},
	};

	app.use('/schools', service(options));
	const schoolService = app.service('/schools');
	schoolService.hooks(hooks);

	app.use('/schools/:schoolId/maintenance', new SchoolMaintenanceService());

	/* schoolGroup service */
	app.use('/schoolGroup', service({
		Model: schoolModels.schoolGroupModel,
		paginate: {
			default: 500,
			max: 5000,
		},
	}));
	const schoolGroupService = app.service('/schoolGroup');
	schoolGroupService.hooks(schoolGroupHooks);

	/* year Service */
	app.use('/years', service({
		Model: schoolModels.yearModel,
		paginate: {
			default: 500,
			max: 5000,
		},
	}));
	const yearService = app.service('/years');
	yearService.hooks(hooks);

	/* gradeLevel Service */
	app.use('/gradeLevels', service({
		Model: schoolModels.gradeLevelModel,
		paginate: {
			default: 500,
			max: 5000,
		},
	}));
	const gradeLevelService = app.service('/gradeLevels');
	gradeLevelService.hooks(hooks);
};
