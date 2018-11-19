const logger = require('winston');

/**
 * A basic syncer that provides step-by-step execution, statistics, and logging
 */
class Syncer {
	constructor(app, system, stats={}) {
		this.app = app;
		this.system = system;
		this.stats = Object.assign(stats, {
			successful: undefined,
		});
	}

	/**
	 * Defines a set of steps to be executed by this syncer
	 * @returns {Promise} Promise that resolves after all steps have completed
	 * or rejects if an error occurred
	 */
	steps() {
		return Promise.resolve();
	}

	/**
	 * Executes all steps and logs status and stats
	 * @returns {Promise} Promise resolving with statistics (check
	 * `stats.successful` for result)
	 */
	sync() {
		this.logInfo('Started syncing');
		return this.steps()
		.then(_ => {
			this.stats.successful = true;
			this.logInfo('Finished syncing.');
			return Promise.resolve(this.stats);
		})
		.catch(err => {
			this.stats.successful = false;
			this.logError('Error while syncing', err);
			return Promise.resolve(this.stats);
		});
	}

	/**
	 * Defines a prefix to be used in all log messages of this syncer
	 * @returns {String}
	 */
	prefix() {
		return `${this.system.alias}`;
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
