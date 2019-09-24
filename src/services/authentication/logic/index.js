const jwtFromCookieString = (cookieString) => {
	try {
		const cookies = cookieString.split(';');
		let jwt;
		cookies.forEach((cookie) => {
			if (cookie.includes('jwt')) {
				const current = cookie.split('=');
				if (current[0] === 'jwt') {
					jwt = current[1];
				}
			}
		});
		return jwt;
	} catch (e) {
		return undefined;
	}
};

const extractTokenFromBearerHeader = (header) => header.replace('Bearer ', '');

const authHeaderExtractor = (req) => {
	const authHeader = req.headers.authorization;
	if (!authHeader) { return undefined; }
	return extractTokenFromBearerHeader(authHeader);
};

module.exports = {
	jwtFromCookieString,
	extractTokenFromBearerHeader,
	authHeaderExtractor,
};
