module.exports = {
	jwtFromCookieString: (cookieString) => {
		try {
			const cookies = cookieString.split(';');
			let jwt;
			cookies.map((cookie) => {
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
	},
	authHeaderExtractor: (req) => {
		const authHeader = req.headers.authorization;
		if (!authHeader) { return undefined; }
		return this.extractTokenFromBearerHeader(authHeader);
	},
	extractTokenFromBearerHeader: (header) => header.replace('Bearer ', ''),
};
