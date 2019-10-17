/*
 * This File contains Helpers for Comparison of Objects.
 */

module.exports = {
	ObjectId: {
		/**
		 * Compares a list of at least two ObjectIds to equal each other.
		 *
		 * @param {[ObjectId]} args
		 * @returns {Boolean}
		 */
		Equal(...args) {
			if (!args || args.length < 2) throw new Error('could not compare less than two id\'s');
			const [firstId, ...otherIds] = args;
			const firstIdAsString = String(firstId);
			return otherIds.every((id) => firstIdAsString === String(id));
		},
	},
};
