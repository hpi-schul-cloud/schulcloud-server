/**
 * This params is use to send valid request to editor micro services.
 * It can use if user that should execute the request is not the same like in the original request.
 * It can also use if no user exist and must be added.
 * It can also use to execute a request with force access, that ignor scope and restriction hooks in
 * editor mirco services. But be carfull not every hook can pass and not every request has the force options.
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
