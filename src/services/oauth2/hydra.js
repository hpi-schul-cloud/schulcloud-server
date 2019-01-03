const request = require('request-promise-native');
const uj = require('url-join');

const mockTlsTermination = {
	'X-Forwarded-Proto': 'https'
};

module.exports = (hydraUrl) => {

	function get(flow, challenge) {
		const options = {
			uri: uj(hydraUrl, '/oauth2/auth/requests/' + flow + '/' + challenge),
			headers: {
				...mockTlsTermination
			},
			json: true
		};
		return request(options);
	}

	// A little helper that takes type (can be "login" or "consent"), the action (can be "accept" or "reject") and a challenge and returns the response from ORY Hydra.
	function put(flow, action, challenge, body) {
		const options = {
			uri: uj(hydraUrl, '/oauth2/auth/requests/' + flow + '/' + challenge + '/' + action),
			method: 'PUT',
			body,
			headers: {
				...mockTlsTermination
			},
			json: true
		};
		return request(options);
	}

	return {

		// Fetches information on a login request.
		getLoginRequest: function (challenge) {
			return get('login', challenge);
		},
		// Accepts a login request.
		acceptLoginRequest: function (challenge, body) {
			return put('login', 'accept', challenge, body);
		},
		// Rejects a login request.
		rejectLoginRequest: function (challenge, body) {
			return put('login', 'reject', challenge, body);
		},
		// Fetches information on a consent request.
		getConsentRequest: function (challenge) {
			return get('consent', challenge);
		},
		// Accepts a consent request.
		acceptConsentRequest: function (challenge, body) {
			return put('consent', 'accept', challenge, body);
		},
		// Rejects a consent request.
		rejectConsentRequest: function (challenge, body) {
			return put('consent', 'reject', challenge, body);
		},
		introspectOAuth2Token: (token, scope) => {
			const options = {
				uri: uj(hydraUrl, '/oauth2/introspect'),
				method: 'POST',
				body: `token=${token}&scope=${scope}`,
				headers: {
					...mockTlsTermination,
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				json: true
			};
			return request(options);
		},
		isInstanceAlive: () => request({
			uri: uj(hydraUrl, '/health/alive')
		}),
		listOAuth2Clients: () => request({
			uri: uj(hydraUrl, '/clients'),
			headers: {
				...mockTlsTermination
			}
		}),
		createOAuth2Client: (data) => request({
			uri: uj(hydraUrl, '/clients'),
			method: 'POST',
			body: data,
			headers: {
				...mockTlsTermination
			},
			json: true
		}),
		deleteOAuth2Client: (id) => request({
			uri: uj(hydraUrl, `/clients/${id}`),
			method: 'DELETE',
			headers: {
				...mockTlsTermination
			}
		})
	};
}
