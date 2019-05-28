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

const sort = (data, sortOrder) => {
	if (!data) {
		return data;
	}
	let valueOp = v => v;
	let descending = false;
	if (typeof sortOrder === 'string') {
		descending = /^-/.test(sortOrder);
		const match = /^-?(.*)/.test(sortOrder);
		if (match) {
			const attributeName = sortOrder.match(/-?(.*)/)[1];
			if (attributeName.length > 0) {
				valueOp = item => item[attributeName];
			}
		}
	}
	return data.sort((a, b) => {
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
