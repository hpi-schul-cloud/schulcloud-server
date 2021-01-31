const path = require('path');
const createService = require('feathers-mongoose');
const { static: staticContent } = require('@feathersjs/express');
const { Configuration } = require('@hpi-schul-cloud/commons');

const schoolModels = require('./schools.model');
const hooks = require('./schools.hooks');
const { SchoolMaintenanceService } = require('./maintenance');
const { HandlePermissions, handlePermissionsHooks } = require('./services/permissions');

module.exports = (app) => {
    const servicePath = '/schools';
    app.use(`${servicePath}/api`, staticContent(path.join(__dirname, '/docs/openapi.yaml')));

    const paginate = {
        default: 5,
        max: 100, // this is the max currently used in the SHD
    };

    app.use(servicePath, createService({
        Model: schoolModels.schoolModel,
        paginate,
        lean: {
            virtuals: true,
        }
    }));
    const service = app.service(servicePath);
    service.hooks(hooks);

    app.use('/schools/:schoolId/maintenance', new SchoolMaintenanceService());

    const ADMIN_TOGGLE_STUDENT_VISIBILITY = Configuration.get('ADMIN_TOGGLE_STUDENT_VISIBILITY');

    if (ADMIN_TOGGLE_STUDENT_VISIBILITY!=='disabled') {
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
