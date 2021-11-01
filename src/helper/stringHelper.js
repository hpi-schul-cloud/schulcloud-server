const isNotEmptyString = (data, trim = false) => {
	var result = false;
	result = typeof data === 'string';
	if(result) {
		if(trim) {
			result = data.trim().length > 0 ;
		}
		else {
			result = data.length > 0;
		}
	}
	return result;
};


module.exports = {
	isNotEmptyString,
};
