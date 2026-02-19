const events = require('events');
const mongoose = require('mongoose');
const { Configuration } = require('@hpi-schul-cloud/commons');

const { ENVIRONMENTS } = require('../../../config/environments');

const TestEventEmitter = new events.EventEmitter();
if (Configuration.get('NODE_ENV') === ENVIRONMENTS.TEST) {
	mongoose.set('debug', (coll, method, query, ...args) => {
		if (method !== 'createIndex') {
			TestEventEmitter.emit('mongoose_test_calls', { coll, method, query, args });
		}
	});
}

module.exports = TestEventEmitter;
