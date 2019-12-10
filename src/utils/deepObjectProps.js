const logger = require('../logger');

const pathToArray = (...paths) => {
	let keys = [];
	try {
		paths.forEach((path) => {
			let newKeys = [];
			if (typeof path === 'string') {
				newKeys = path.split('.'); // for dot notation y.asd.asdasd.sdada
			} else if (Array.isArray(path)) {
				newKeys = path;
			//	} else if (typeof path === 'object') {
			//		// TODO: ?
			} else {
				throw new Error('Wrong type is adding as path in deepObjectProps.');
			}
			keys = [...keys, ...newKeys];
		});
		return keys;
	} catch (err) {
		logger.info(err);
		return '';
	}
};

const get = (obj, ...paths) => { // TODO: write tests! 
	try {
		let value = obj;

		pathToArray(...paths).forEach((key) => {
			value = value[key];
		});

		return value;
	} catch (err) {
		return undefined;
	}
};

const set = () => {}; // TODO: Add it!

module.exports = {
	get,
	pathToArray,
};
