const service = require('feathers-mongoose');
const { Configuration } = require('@hpi-schul-cloud/commons');
const { static: staticContent } = require('@feathersjs/express');
const path = require('path');

const schoolModels = require('./model');
const hooks = require('./hooks');
const publicSchoolsHooks = require('./hooks/publicSchools.hooks');
const schoolGroupHooks = require('./hooks/schoolGroup.hooks');
const yearsHooks = require('./hooks/years.hooks');
const { SchoolMaintenanceService } = require('./maintenance');
const { HandlePermissions, handlePermissionsHooks } = require('./services/permissions');
const { SchoolsListService } = require('./services/schoolsList');

module.exports = function schoolServices() {
	const app = this;

	app.use('/schools/api', staticContent(path.join(__dirname, '/docs/openapi.yaml')));

	const options = {
		Model: schoolModels.schoolModel,
		paginate: {
			default: 5,
			max: 100, // this is the max currently used in the SHD
		},
		lean: {
			virtuals: true,
		},
	};

	app.use('/schools', service(options));
	const schoolService = app.service('/schools');
	schoolService.hooks(hooks);

	// public endpoint, called from login
	app.use('/schoolsList/api', staticContent(path.join(__dirname, './docs/openapi.yaml')));
	app.use(
		'/schoolsList',
		new SchoolsListService({
			Model: schoolModels.schoolModel,
			paginate: {
				default: 2,
				max: 3,
			},
		})
	);
	const schoolsListService = app.service('schoolsList');
	schoolsListService.hooks(publicSchoolsHooks);

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

	/* year Service */
	app.use(
		'/years',
		service({
			Model: schoolModels.yearModel,
			paginate: {
				default: 500,
				max: 5000,
			},
			lean: true,
		})
	);
	const yearService = app.service('/years');
	yearService.hooks(yearsHooks);

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

	const ADMIN_TOGGLE_STUDENT_VISIBILITY = Configuration.get('ADMIN_TOGGLE_STUDENT_VISIBILITY');

	if (ADMIN_TOGGLE_STUDENT_VISIBILITY !== 'disabled') {
		app.use('/school/teacher/studentvisibility', new HandlePermissions('teacher', 'STUDENT_LIST'));
		const handlePermissionsService = app.service('/school/teacher/studentvisibility');
		handlePermissionsService.hooks(handlePermissionsHooks);
	}

	const FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED = Configuration.get(
		'FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED'
	);
	if (FEATURE_ADMIN_TOGGLE_STUDENT_LERNSTORE_VIEW_ENABLED) {
		app.use('/school/student/studentlernstorevisibility', new HandlePermissions('student', 'LERNSTORE_VIEW'));
		const handleLernStorePermissionsService = app.service('/school/student/studentlernstorevisibility');
		handleLernStorePermissionsService.hooks(handlePermissionsHooks);
	}
};
