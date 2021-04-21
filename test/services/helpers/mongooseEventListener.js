const events = require('events');
const mongoose = require('mongoose');

const {
	NODE_ENV,
	ENVIRONMENTS,
} = require('../../../config/globals');

const TestEventEmitter = new events.EventEmitter();
if (NODE_ENV === ENVIRONMENTS.TEST) {
	mongoose.set('debug', (coll, method, query, ...args) => {
		if (method!=='createIndex') {
			TestEventEmitter.emit('mongoose_test_calls', {coll, method, query, args});
		}
	})
}

module.exports = TestEventEmitter;