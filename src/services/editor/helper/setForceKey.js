const logger = require('winston');

module.exports = (app) => {
	const key = process.env.EDITOR_MS_FORCE_KEY;
	if (!key) {
		logger.warn('EDITOR_MS_FORCE_KEY is not defined!');
	}
	app.set('EDITOR_MS_FORCE_KEY', key);
};
