const isNotEmptyString = (data, trim = false) => typeof data === 'string' && ((trim && data.trim().length > 0) || data.length > 0);

module.exports = {
	isNotEmptyString,
};
