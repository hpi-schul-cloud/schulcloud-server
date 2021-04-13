/**
 * Extracts limit and skip from a query and adds valid values to the result object praefixing names with $.
 * Fails for invalid values, undefined keys are removed.
 * @param {*} query
 * @returns
 */
const getPaginationPropertiesFromQuery = (query) => {
	const { limit, skip } = query;
	const result = {};
	if (limit != null) {
		// TODO if (!Number.isInteger(Number.parseInt(limit, 10))) throw new Error('a given limit must be an integer');
		result.$limit = limit;
	}
	if (skip != null) {
		// TODO if (!Number.isInteger(Number.parseInt(skip, 10))) throw new Error('a given skip must be an integer');
		result.$skip = skip;
	}
	return result;
};

module.exports = { getPaginationPropertiesFromQuery };
