const service = require('../../utils/feathers-mongoose');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const schoolModels = require('./model');
const hooks = require('./hooks');
const schoolGroupHooks = require('./hooks/schoolGroup.hooks');
const { SchoolMaintenanceService } = require('./maintenance');

module.exports = function schoolServices() {
	const app = this;

	app.use('/schools/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));
	app.use(
		'/schools',
		service({
			Model: schoolModels.schoolModel,
			paginate: {
				default: 5,
				max: 100, // this is the max currently used in the SHD
			},
			lean: {
				virtuals: true,
			},
		})
	);
	const schoolService = app.service('/schools');
	schoolService.hooks(hooks);

	app.use('/schools/:schoolId/maintenance', new SchoolMaintenanceService());

	/* schoolGroup service */
	app.use(
		'/schoolGroup',
		service({
			Model: schoolModels.schoolGroupModel,
			paginate: {
				default: 500,
				max: 5000,
			},
		})
	);
	const schoolGroupService = app.service('/schoolGroup');
	schoolGroupService.hooks(schoolGroupHooks);

	/* gradeLevel Service */
	app.use(
		'/gradeLevels',
		service({
			Model: schoolModels.gradeLevelModel,
			paginate: {
				default: 500,
				max: 5000,
			},
			lean: true,
		})
	);
	const gradeLevelService = app.service('/gradeLevels');
	gradeLevelService.hooks(hooks);
};
