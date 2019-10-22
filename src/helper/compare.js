/*
 * This File contains Helpers for Comparison of Objects.
 */

const logger = require('../logger');

module.exports = {
	ObjectId: {
		/**
		 * Compares a list of at least two ObjectIds to equal each other.
		 *
		 * @param {...ObjectId|String} args
		 * @returns {Boolean}
		 */
		Equal(...args) {
			if (!args || args.length < 2) throw new Error('could not compare less than two id\'s');
			const [firstId, ...otherIds] = args;
			const firstIdAsString = String(firstId);
			if (!firstIdAsString.match('[0-9a-f]{24}')) {
				logger.warning('received invalid object ids to compare', args);
				return false;
			}
			return otherIds.every((id) => firstIdAsString === String(id));
		},
	},
};
