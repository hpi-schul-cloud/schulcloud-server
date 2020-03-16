const logger = require('../../../src/logger/index');

const memoEnv = {};
const setEnv = (name, value) => {
	const oldValue = process.env[name];
	if (!oldValue) {
		logger.error(`[TestObjects] The env ${name} do not exist. It can not modified.`);
	} else {
		memoEnv[name] = oldValue;
		process.env[name] = value;
		logger.info(`[TestObjects] The env ${name} is set to ${value}`);
	}
};

const revertEnv = (name) => {
	if (!memoEnv[name]) {
		logger.error(`[TestObjects] The env ${name} do not exist. It can not reverted.`);
	} else {
		process.env[name] = memoEnv[name];
		delete memoEnv[name];
		logger.info(`[TestObjects] The env ${name} is reverted.`);
	}
};

const revertAllEnvs = () => {
	Object.keys(memoEnv).forEach((name) => {
		revertEnv(name);
	});
};

module.exports = {
	setEnv,
	revertEnv,
	revertAllEnvs,
};
