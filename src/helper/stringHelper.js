const { NotFound } = require('../errors');

const isNotEmptyString = (data, trim = false) => {
	if ( typeof data === 'string' ) {
		if (( trim ) && ( data.trim().length > 0 )) {
			return true;
		}
		else if ( data.length > 0 ) {
			return true;
		}
		else {
			return false;
		}
	}
	else {
		return false;
	}
};

module.exports = {
	isNotEmptyString,
};
