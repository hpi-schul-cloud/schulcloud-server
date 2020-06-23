// ***************** IMPORTANT *****************
// Please note that if you add a new keyword,
// please create the necessary service and make
// adjustments in this file
//
//	1.	add new Keyword
//	2.	define construction and deconstruction
//		pattern for QuarantinedObject
//	3. 	create new service with the name of your
//		new Keyword. There must be at least one
// 		method (update) which takes over the
//		execution of the entry (jobs). You should
//		also create a create method, which can
//		create a new entry.
//	4.	register the route for your new service,
//		it must follow this scheme:
//		/activation/${KEYWORDS.YOUR_NEW_KEYWORD}
// ***************** IMPORTANT *****************

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
