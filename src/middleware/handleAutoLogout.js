const errors = require('@feathersjs/errors');
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {

	// Check if jwt is available, if not let request pass
	if (req.headers.authorization) {
		const decodedToken = jwt.decode(req.headers.authorization.replace('Bearer ', ''));
		const tokenJti = decodedToken.jti; // UID of the token 

		// Check if JTI is in white list and still valid (with redis)

		// Update JTI valid time
	}

	next();
};
