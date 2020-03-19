const logger = require('../../../src/logger/');

const memoEnv = {};
const setEnv = (name, value) => {
	// can have value undefined
	const oldValue = process.env[name];
	memoEnv[name] = oldValue;
	process.env[name] = value;
	logger.info(`[TestObjects] The env ${name} is set to ${value}`);
};

const revertEnv = (name) => {
	if (memoEnv[name]) {
		process.env[name] = memoEnv[name];
		delete memoEnv[name];
	}
	// outside of if, becouse value of memoEnv can undefined
	logger.info(`[TestObjects] The env ${name} is reverted.`);
};

const revertAllEnvs = () => {
	const keys = Object.keys(memoEnv);
	keys.forEach((name) => {
		process.env[name] = memoEnv[name];
		delete memoEnv[name];
	});
	logger.info(`[TestObjects] The envs ${keys} are reverted.`);
};

module.exports = {
	setEnv,
	revertEnv,
	revertAllEnvs,
};
