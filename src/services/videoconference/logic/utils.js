const url = require('url');

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
	isNullOrEmpty: (stringValue) => {
		if (stringValue === null || stringValue === undefined) {
			return false;
		}
		if (typeof stringValue !== 'string' || stringValue.length === 0) {
			return false;
		}
		return true;
	},
};
