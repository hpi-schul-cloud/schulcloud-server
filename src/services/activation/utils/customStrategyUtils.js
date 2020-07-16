/**
 * valid Keywords and services
 */
const KEYWORDS = {
	E_MAIL_ADDRESS: 'eMailAddress',
};

/**
 * Construct QuarantinedObject from payload for db
 * @param {String} keyword	keyword
 * @param {*} payload 		data to save as QuarantinedObject in db
 * @returns {Object}		QuarantinedObject
 */
const createQuarantinedObject = (keyword, payload) => {
	switch (keyword) {
		case KEYWORDS.E_MAIL_ADDRESS:
			return {
				email: payload,
			};

		default:
			throw new Error(`No pattern defined for ${keyword}`);
	}
};

/**
 * Deconstruct QuarantinedObject
 * @param {Object} entry	Entry
 * @returns {*}				reconstructed data
 */
const getQuarantinedObject = (entry) => {
	switch (entry.keyword) {
		case KEYWORDS.E_MAIL_ADDRESS:
			return entry.quarantinedObject.email;

		default:
			throw new Error(`No dissolution defined for ${entry.keyword}`);
	}
};

module.exports = {
	getQuarantinedObject,
	createQuarantinedObject,
	KEYWORDS,
};
