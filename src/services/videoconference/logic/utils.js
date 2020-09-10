const url = require('url');
const { MESSAGE_KEYS, RESPONSE_STATUS } = require('./constants');

module.exports = {
	/**
	 * returns url parsed from urlString, if returnUrl set to true.
	 * if returnUrl is not true, returns just true/false depending on parsing succeeds
	 * when parsing the url fails, returns false always
	 */
	isUrl: (urlString, returnUrl) => {
		try {
			const parsedUrl = url.parse(urlString);
			return returnUrl === true ? parsedUrl : true;
		} catch (err) {
			return false;
		}
	},
	copyPropertyNameIfIncludedInValuesFromSourceToTarget: ({
		source,
		propertyName,
		values,
		target,
		sourcePropertyNames = null,
	}) => {
		const propertyNames = sourcePropertyNames || Object.getOwnPropertyNames(source);
		if (propertyNames.includes(propertyName) && Array.isArray(values) && values.includes(source[propertyName])) {
			target[propertyName] = source[propertyName];
			return true;
		}
		return false;
	},
	isValidNotFoundResponse: (response) =>
		response && Array.isArray(response.messageKey) && response.messageKey.includes(MESSAGE_KEYS.NOT_FOUND),
	isValidFoundResponse: (response) =>
		response && Array.isArray(response.returncode) && response.returncode.includes(RESPONSE_STATUS.SUCCESS),
};
