const logger = require('winston');

class Syncer {
	constructor(app, system, stats={}) {
		this.app = app;
		this.system = system;
		this.stats = Object.assign(stats, {
			successful: 0,
			failed: 0,
		});
	}

	prefix() {
		return `${this.system.alias}`;
	}

	sync() {
		this.logInfo('Started syncing');
		return this.steps()
		.then(_ => {
			this.stats.successful += 1;
			this.logInfo('Finished syncing.');
			return Promise.resolve(this.stats);
		})
		.catch(err => {
			this.stats.failed += 1;
			this.logError('Error while syncing', err);
			return Promise.resolve(this.stats);
		});
	}

	steps() {
		return Promise.resolve();
	}

	logInfo(message, ...args) {
		logger.info(`[${this.prefix()}] ${message}`, ...args);
	}

	logWarning(message, ...args) {
		logger.warn(`[${this.prefix()}] ${message}`, ...args);
	}

	logError(message, ...args) {
		logger.error(`[${this.prefix()}] ${message}`, ...args);
	}
}



module.exports = Syncer;
