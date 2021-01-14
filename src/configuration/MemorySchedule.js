const { Configuration } = require('@hpi-schul-cloud/commons');
const { info } = require('../utils/systemInfo');
const logger = require('../logger');

const MemorySchedule = () => {
	const time = Configuration.get('MEMORY_INTERVAL_TIME');
	if (time > 0) {
		const secTime = time * 1000;
		logger.alert(`Enabled MemorySchedule with ${time} sec inteval.`);
		setInterval(() => {
			logger.alert(info.memory());
		}, secTime);
	}
};

module.exports = MemorySchedule;
