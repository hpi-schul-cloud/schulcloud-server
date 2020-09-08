const _ = require('lodash');
const logger = require('../logger');

const validateKeys = (newKeys) =>
	newKeys.reduce((validatedKeys, key) => {
		if (key && key !== '') {
			// remove invalid pathes
			validatedKeys.push(key);
		}
		return validatedKeys;
	}, []);

/**
 * @param  {...String||Array} paths
 */
const pathsToArray = (...paths) => {
	try {
		let keys = [];
		(paths || []).forEach((path) => {
			if (path) {
				// avoid null and undefined
				let newKeys = [];
				if (typeof path === 'string') {
					// for dot notation y.asd.asdasd.sdada and array notations like a[0]
					newKeys = path.replace(/\[/g, '.').replace(/]/g, '.').split('.');
				} else if (Array.isArray(path)) {
					newKeys = pathsToArray(...path);
				} else {
					throw new Error('Wrong type is adding as path in deepObjectProps.');
				}

				keys = [...keys, ...validateKeys(newKeys)];
			}
		});
		return keys;
	} catch (err) {
		logger.error(err);
		return [];
	}
};

/**
 * Returns the value of a (nested) attribute
 * @param {*} item a value
 * @param {String} pathString a string describing the attribute to select
 * @example
 * getSimple({foo: 'bar'}, 'foo') => 'bar'
 * getSimple({foo: {bar: 'baz'}}, 'foo.bar') => 'baz'
 */
const getSimple = (item, pathString) => {
	if (!item || !pathString) return item;
	try {
		const chain = pathString.split('.');
		let result = item;

		chain.forEach((key) => {
			result = result[key];
		});
		return result;
	} catch (err) {
		return undefined;
	}
};

/**
 * Attention to resolve the path it is used _.toPath and not pathToArray.
 * @param {*} obj
 * @param  {...any} paths
 */
const get = (obj, ...paths) => {
	try {
		let result = obj;
		if (Array.isArray(paths)) {
			// pathToArray(...paths) if it is changed then the test for objects return other result
			_.toPath(...paths).forEach((key) => {
				result = result[key];
			});
		}
		return result;
	} catch (err) {
		return undefined;
	}
};

// const set = () => {}; // TODO: Add it!

// action = () => {}
// delete = () => {}

module.exports = {
	get,
	getSimple,
	pathsToArray,
};
