const logger = require('../logger');
const MemorySchedule = require('./MemorySchedule');

module.exports = () => {
	logger.alert('Start app configuration...');
	MemorySchedule();
};
