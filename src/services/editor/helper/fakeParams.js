/**
 * This fake passing die user id to params, that the editor MS has a valid input.
 */
module.exports = ({ userId, force = false }) => {
	const params = {
		account: {},
		query: {},
	};
	if (userId) {
		params.account.userId = userId;
	}
	if (force === true) {
		params.query.force = process.env.EDITOR_MS_FORCE_KEY;
	}
	return params;
};
