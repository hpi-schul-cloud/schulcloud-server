/**
 * Recursively flattens an array
 * @param {Array} arr array to flatten
 * @example flatten([1, [2], [[3, 4], 5], 6]) => [1, 2, 3, 4, 5, 6]
 * @returns {Array} flatted array
 */
const flatten = arr => arr.reduce((agg, el) => {
	if (el instanceof Array) {
		return agg.concat(flatten(el));
	}
	return agg.concat(el);
}, []);

/**
 * Emulates Feathers-style pagination on a given array.
 * @param {Array} data Array-like collection to paginate
 * @param {Object} params Feathers request params containing $paginate, $limit, and $skip
 * @returns {Object} { total, limit, skip, data }
 */
const paginate = (data, params) => {
	if (!params || !params.$paginate) {
		return data;
	}
	let limit = params.$limit || data.length;
	if (limit < 0) {
		limit = data.length;
	}
	let skip = params.$skip || 0;
	if (skip < 0) {
		skip = 0;
	}
	const paginatedData = data.slice(skip, skip + limit);
	return {
		total: data.length,
		limit,
		skip,
		data: paginatedData,
	};
};

/**
 * Sort an array using mongodb-notation
 * @param {Array} data the array to sort
 * @param {String} sortOrder mongodb-like sort order (see examples)
 * @example
 * sort([]) => [];
 * sort([1, 3, 2]) => [1, 2, 3];
 * sort([1, 3, 2], '-') => [3, 2, 1];
 * sort([{a: 2}, {a: 1}], 'a') => [{a: 1}, {a: 2}];
 * sort([{b: 4}, {b: 5}], '-b') => [{b: 5}, {b: 4}];
 */
const sort = (data, sortOrder) => {
	if (!data) {
		return data;
	}
	// if not otherwise specified, sort by value (descending):
	let valueOp = v => v;
	let descending = false;

	if (typeof sortOrder === 'string') {
		descending = /^-/.test(sortOrder);
		const match = /^-?(.*)/.test(sortOrder);
		if (match) {
			// sort by attribute value
			const attributeName = sortOrder.match(/-?(.*)/)[1];
			if (attributeName.length > 0) {
				valueOp = item => item[attributeName];
			}
		}
	}
	return data.sort((a, b) => {
		// use string.localeCompare to work on Strings, dates, and numbers
		if (descending) {
			return (`${valueOp(b)}`).localeCompare(`${valueOp(a)}`);
		}
		return (`${valueOp(a)}`).localeCompare(`${valueOp(b)}`);
	});
};

module.exports = {
	flatten,
	paginate,
	sort,
};
