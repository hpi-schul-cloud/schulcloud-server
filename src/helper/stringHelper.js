const isNotEmptyString = (data, trim = false) =>
	typeof data === 'string' && ((trim && data.trim().length > 0) || (!trim && data.length > 0));

module.exports = {
	isNotEmptyString,
};
