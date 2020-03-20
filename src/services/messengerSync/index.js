const eventListener = require('./eventListener');
const consumer = require('./consumer');
const { messengerSchoolSyncService, messengerSchoolSyncHooks } = require('./services/schoolSyncService');
const { messengerTokenService, messengerTokenHooks } = require('./services/messengerTokenService');

module.exports = (app) => {
	app.use('schools/:schoolId/messengerSync', messengerSchoolSyncService);
	app.service('schools/:schoolId/messengerSync').hooks(messengerSchoolSyncHooks);

	app.use('messengerToken', messengerTokenService);
	app.service('messengerToken').hooks(messengerTokenHooks);

	app.configure(eventListener);
	app.configure(consumer);
};
