const KEYWORDS = {
	E_MAIL_ADDRESS: 'eMailAddress',
};

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
