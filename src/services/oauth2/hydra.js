const axios = require('axios');

const mockTlsTermination = {
	'X-Forwarded-Proto': 'https',
};

module.exports = (hydraUrl) => {
	return {
		introspectOAuth2Token: async (token, scope) => {
			const options = {
				url: `${hydraUrl}/oauth2/introspect`,
				method: 'POST',
				data: `token=${token}&scope=${scope}`,
				headers: {
					...mockTlsTermination,
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			};
			const res = await axios(options);

			return res.data;
		},
	};
};
