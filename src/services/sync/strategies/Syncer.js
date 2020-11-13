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
	async sync() {
		this.logInfo('Started syncing');
		try {
			await this.steps();
		} catch (err) {
			this.logError('Error while syncing', { error: err });
			this.stats.errors.push(err);
		}
		this.stats.success = this.successful();
		const aggregated = Syncer.aggregateStats(this.stats);
		this.logInfo('Finished syncing', aggregated);
		return this.stats;
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
			return stats.reduce(
				(agg, cur) => {
					const current = this.aggregateStats(cur);
					return {
						successful: agg.successful + current.successful,
						failed: agg.failed + current.failed,
					};
				},
				{ successful: 0, failed: 0 }
			);
		}
		return {
			successful: stats && stats.success === true ? 1 : 0,
			failed: stats && stats.success !== true ? 1 : 0,
		};
	}

	/**
	 * Returns true if no errors occurred (based on stats). Returns false otherwise.
	 * Can be overridden for more complex success criteria.
	 * @returns {Boolean} true/false
	 */
	successful() {
		return this.stats.errors.length === 0;
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
