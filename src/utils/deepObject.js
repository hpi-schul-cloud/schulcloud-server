const logger = require('../logger');

const validateKeys = (newKeys) => newKeys.reduce((validatedKeys, key) => {
	if (key && key !== '') {	// remove invalid pathes
		validatedKeys.push(key);
	}
	return validatedKeys;
}, []);

const pathToArray = (...paths) => {
	try {
		let keys = [];
		(paths || []).forEach((path) => {
			if (path) {	// avoid null and undefined
				let newKeys = [];
				if (typeof path === 'string') {
					newKeys = path.split('.'); // for dot notation y.asd.asdasd.sdada
				} else if (Array.isArray(path)) {
					newKeys = pathToArray(...path);
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

const get = (obj, ...paths) => {
	try {
		let result = obj;
		if (Array.isArray(paths)) {
			pathToArray(...paths).forEach((key) => {
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
	pathToArray,
};
