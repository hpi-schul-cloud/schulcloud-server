const { Configuration } = require('@schul-cloud/commons');
const {	GeneralError } = require('@feathersjs/errors');
const eventListener = require('./eventListener');
const consumer = require('./consumer');
const { messengerSchoolSyncService, messengerSchoolSyncHooks } = require('./services/schoolSyncService');
const { messengerTokenService, messengerTokenHooks } = require('./services/messengerTokenService');

module.exports = (app) => {
	if (Configuration.get('FEATURE_MATRIX_MESSENGER_ENABLED')) {
		if (!Configuration.get('FEATURE_RABBITMQ_ENABLED')) throw new GeneralError('messenger requires rabbitMQ');

		app.use('schools/:schoolId/messengerSync', messengerSchoolSyncService);
		app.service('schools/:schoolId/messengerSync').hooks(messengerSchoolSyncHooks);

		app.use('messengerToken', messengerTokenService);
		app.service('messengerToken').hooks(messengerTokenHooks);

		app.configure(eventListener);
		app.configure(consumer);
	}
};
