const logger = require('winston');

/**
 * A basic syncer that provides step-by-step execution, statistics, and logging
 */
class Syncer {
	constructor(app, stats={}) {
		this.app = app;
		this.stats = Object.assign(stats, {
			successful: undefined,
		});
	}

	/**
	 * Defines to which requests this Syncer will answer
	 * @abstract
	 * @static
	 * @param {String} target the sync target requested by the caller
	 * @returns {Boolean} true if the syncer accepts the target, false otherwise
	 */
	static respondsTo(target) {
		throw new TypeError('Method has to be implemented.');
	}

	/**
	 * Defines how query params are mapped to constructor params
	 * @abstract
	 * @static
	 * @param {Object} params query params object
	 * @returns {iterableObj} iterable object to be spread as constructor
	 * arguments or falsy value if the parameters are not valid
	 */
	static params(params) {
		throw new TypeError('Method has to be implemented.');
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
		return this.constructor.name;
	}

	/**
	 * Aggregates stats of a collection of (nested) sync calls
	 * @static
	 * @param {Object | Array} stats stats object or array of stats objects
	 * @returns stats object {successful, failed} summing up all input stats
	 */
	static aggregateStats(stats) {
		if (Array.isArray(stats)) {
			return stats.reduce((agg, cur) => {
				cur = this.aggregateStats(cur);
				if (cur.successful) {
					agg.successful += 1;
				} else {
					agg.failed += 1;
				}
				return agg;
			}, { successful: 0, failed: 0 });
		} else {
			return stats;
		}
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
