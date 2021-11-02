const isNotEmptyString = (data, trim = false) => return typeof data === 'string' && ((trim && data.trim().length > 0) || data.length > 0));

module.exports = {
	isNotEmptyString,
};
