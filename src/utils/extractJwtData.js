const jwt = require('jsonwebtoken');

function extractJwtData(token) {
	const decodedToken = jwt.decode(token.replace('Bearer ', ''));
	if (decodedToken === null) {
		throw new BadRequest('Invalid authentication data');
	}
	const { accountId, jti } = decodedToken;

	return { accountId, jti };
}

module.exports = {
	extractJwtData,
};
