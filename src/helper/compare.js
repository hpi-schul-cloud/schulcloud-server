/*
 * This File contains Helpers for Comparison of Objects.
 */

const logger = require('../logger');

const ObjectId = {
	/**
	 * Compares a list of at least two ObjectIds to equal each other.
	 *
	 * @param {...ObjectId|String} args
	 * @returns {Boolean}
	 */
	equal(...args) {
		if (!args || args.length < 2) throw new Error("could not compare less than two id's");
		const [firstId, ...otherIds] = args;
		const firstIdAsString = String(firstId);
		if (!ObjectId.isValid(firstIdAsString)) {
			logger.debug('received invalid object ids to compare', args);
			return false;
		}
		return otherIds.every((id) => firstIdAsString === String(id));
	},
	/**
	 *
	 * @param {ObjectId|String} id
	 */
	isValid(id) {
		const idAsString = typeof id === 'string' ? id : String(id);
		return /^[0-9a-f]{24}$/.test(idAsString);
	},
	/**
	 * Converts a database given id to it's string represenation
	 * @param {ObjectId|String} id
	 * @returns {String} string representation of the given object id
	 */
	toString(id) {
		return String(id);
	},
};

module.exports = { ObjectId };
