const winstonLogger = require('../../../logger');

/**
 * A basic syncer that provides step-by-step execution, statistics, and logging
 */
class Syncer {
	constructor(app, stats = {}, logger = winstonLogger) {
		this.app = app;
		this.stats = Object.assign(stats, {
			success: undefined,
			errors: [],
		});
		this.logger = logger;
	}

	/**
     * Defines to which requests this Syncer will answer
     * @abstract
     * @static
     * @param {String} target the sync target requested by the caller
     * @returns {Boolean} true if the syncer accepts the target, false otherwise
     */
	static respondsTo(/* target */) {
		throw new TypeError('Method has to be implemented.');
	}

	/**
     * Defines how query params are mapped to constructor params
     * @abstract
     * @static
     * @param {Object} params query params object
     * @param {Object} data optional data object for POST/CREATE requests
     * @returns {iterableObj} iterable object to be spread as constructor
     * arguments or falsy value if the parameters are not valid
     */
	static params(/* params, data */) {
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
     * `stats.success` for result)
     */
	sync() {
		this.logInfo('Started syncing');
		return this.steps()
			.then((stats) => {
				this.stats.success = this.stats.errors.length === 0;
				const aggregated = Syncer.aggregateStats(stats);
				this.logInfo('Finished syncing', aggregated);
				return Promise.resolve(this.stats);
			})
			.catch((err) => {
				this.stats.success = false;
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
				agg.successful += cur.successful;
				agg.failed += cur.failed;
				return agg;
			}, { successful: 0, failed: 0 });
		}
		return {
			successful: stats && stats.success === true ? 1 : 0,
			failed: stats && stats.success === false ? 1 : 0,
		};
	}

	logInfo(message, ...args) {
		this.logger.info(`[${this.prefix()}] ${message}`, ...args);
	}

	logWarning(message, ...args) {
		this.logger.warning(`[${this.prefix()}] ${message}`, ...args);
	}

	logError(message, ...args) {
		this.logger.error(`[${this.prefix()}] ${message}`, ...args);
	}

	logDebug(message, ...args) {
		this.logger.debug(`[${this.prefix()}] ${message}`, ...args);
	}
}

module.exports = Syncer;
