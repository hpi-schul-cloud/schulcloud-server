const { messengerConfigService, messengerConfigHooks } = require('./services/messengerConfigService');
const { messengerPermissionService, messengerPermissionHooks } = require('./services/messengerPermissionService');

module.exports = (app) => {
	app.use('schools/:schoolId/messenger', messengerConfigService);
	app.service('schools/:schoolId/messenger').hooks(messengerConfigHooks);

	app.use('/messengerPermissions', messengerPermissionService);
	app.service('/messengerPermissions').hooks(messengerPermissionHooks);
};
