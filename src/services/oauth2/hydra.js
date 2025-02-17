const request = require('request-promise-native');

const mockTlsTermination = {
	'X-Forwarded-Proto': 'https',
};

module.exports = (hydraUrl) => {
	return {
		introspectOAuth2Token: (token, scope) => {
			const options = {
				uri: `${hydraUrl}/oauth2/introspect`,
				method: 'POST',
				body: `token=${token}&scope=${scope}`,
				headers: {
					...mockTlsTermination,
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				json: true,
			};
			return request(options);
		},
	};
};
