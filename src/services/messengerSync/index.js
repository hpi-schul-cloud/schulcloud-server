const eventListener = require('./eventListener');
const consumer = require('./consumer');
const { messengerSchoolSyncService, messengerSchoolSyncHooks } = require('./services/schoolSyncService');

module.exports = (app) => {
	app.use('schools/:schoolId/messengerSync', messengerSchoolSyncService);
	app.service('schools/:schoolId/messengerSync').hooks(messengerSchoolSyncHooks);

	app.configure(eventListener);
	app.configure(consumer);
};
