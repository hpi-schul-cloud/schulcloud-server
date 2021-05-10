/**
 * Recursively flattens an array
 * @param {Array} arr array to flatten
 * @example flatten([1, [2], [[3, 4], 5], 6]) => [1, 2, 3, 4, 5, 6]
 * @returns {Array} flatted array
 */
const flatten = (arr) =>
	arr.reduce((agg, el) => {
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
 * Converts strings to sortOrder object notation
 * @param {String|Object} input the input value
 */
const convertToSortOrderObject = (input) => {
	if (typeof input === 'object') {
		return input;
	}
	if (typeof input === 'string') {
		const descending = /^-/.test(input);
		const match = /^-?(.*)/.test(input);
		if (match) {
			// sort by attribute value
			const attributeName = input.match(/-?(.*)/)[1];
			const result = {};
			result[attributeName] = descending ? -1 : 1;
			return result;
		}
	}
	return {};
};

/**
 * Returns the value of a (nested) attribute
 * @param {*} item a value
 * @param {String} attribute a string describing the attribute to select
 * @example
 * getValue({foo: 'bar'}, 'foo') => 'bar'
 * getValue({foo: {bar: 'baz'}}, 'foo.bar') => 'baz'
 */
const getValue = (item, attribute) => {
	if (!item || !attribute) return item;
	let chain = attribute.split('.');
	let value = item;
	while (chain.length > 0) {
		value = value[chain[0]];
		chain = chain.slice(1);
	}
	return value;
};

/**
 * Compare two attributes for sorting
 * @param {*} a a value
 * @param {*} b another value
 */
const compare = (a, b) => {
	if (a instanceof Date && b instanceof Date) {
		return a.getTime() - b.getTime();
	}
	// use string comparison for everything else
	return a.toString().localeCompare(b.toString());
};

const sortInternal = (data, sortOrder) =>
	data.sort((a, b) => {
		let returnValue = 0;
		if (Object.keys(sortOrder).length === 0) {
			// if no sortOrder is given, sort by value
			return compare(a, b);
		}
		for (const attribute of Object.keys(sortOrder)) {
			// compare (nested) attribute values and change sign based on attribute sort order
			const [valueA, valueB] = [getValue(a, attribute), getValue(b, attribute)];
			returnValue = compare(valueA, valueB) * sortOrder[attribute];
			// if values are sortable, no further attribute comparisons are necessary
			if (returnValue !== 0) break;
		}
		return returnValue;
	});

/**
 * Sort an array using mongodb-notation
 * @param {Array} data the array to sort
 * @param {String|Object} sortOrder mongodb-like sort order or String (see examples)
 * @example
 * sort([]) => [];
 * sort([1, 3, 2]) => [1, 2, 3];
 * sort([1, 3, 2], '-') => [3, 2, 1];
 * sort([{a: 2}, {a: 1}], 'a') => [{a: 1}, {a: 2}];
 * sort([{b: 4}, {b: 5}], '-b') => [{b: 5}, {b: 4}];
 * sort([{a: 2}, {a: 1}], {a: 1}) => [{a: 1}, {a: 2}];
 * sort([{b: 4}, {b: 5}], {b: -1}) => [{b: 5}, {b: 4}];
 */
const sort = (data, sortOrder) => {
	if (!data) {
		return data;
	}
	const sortOrderObject = convertToSortOrderObject(sortOrder);
	return sortInternal(data, sortOrderObject);
};

const asyncFilter = async (data, predicate) => {
	const results = await Promise.all(data.map(predicate));

	return data.filter((_v, index) => results[index]);
};

const executeInChunks = (data, chunkSize, func) => {
	for (let i = 0; i < data.length; i += chunkSize) {
		const chunk = data.slice(i, i + chunkSize);
		chunk.forEach(func);
	}
};

module.exports = {
	flatten,
	paginate,
	sort,
	convertToSortOrderObject,
	asyncFilter,
	executeInChunks,
};
