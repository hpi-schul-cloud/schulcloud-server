const { Configuration } = require('@schul-cloud/commons');
const { messengerConfigService, messengerConfigHooks } = require('./services/messengerConfigService');
const { messengerPermissionService, messengerPermissionHooks } = require('./services/messengerPermissionService');

module.exports = (app) => {
	if (Configuration.get('MATRIX_MESSENGER__ENABLED')) {
		app.use('schools/:schoolId/messenger', messengerConfigService);
		app.service('schools/:schoolId/messenger').hooks(messengerConfigHooks);

		app.use('schools/:schoolId/messengerPermissions', messengerPermissionService);
		app.service('schools/:schoolId/messengerPermissions').hooks(messengerPermissionHooks);
	}
};
