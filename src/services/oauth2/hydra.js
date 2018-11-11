const fetch = require('node-fetch')
const uj = require('url-join')

const mockTlsTermination = {
	'X-Forwarded-Proto': 'https'
};

const handleResponse = (res) => {
	if (res.status < 200 || res.status > 302) {
		// This will handle any errors that aren't network related (network related errors are handled automatically)
		return res.json().then(function (body) {
			console.error('An error occurred while making a HTTP request: ', body)
			return Promise.reject(new Error(body.error.message))
		})
	}

	return res.json();
}

module.exports = (hydraUrl) => {

	function get(flow, challenge) {
		return fetch(uj(hydraUrl, '/oauth2/auth/requests/' + flow + '/' + challenge),
			{
				headers: {
					...mockTlsTermination
				}
			}).then(handleResponse);
	}

	// A little helper that takes type (can be "login" or "consent"), the action (can be "accept" or "reject") and a challenge and returns the response from ORY Hydra.
	function put(flow, action, challenge, body) {
		return fetch(
			uj(hydraUrl, '/oauth2/auth/requests/' + flow + '/' + challenge + '/' + action),
			{
				method: 'PUT',
				body: JSON.stringify(body),
				headers: {
					'Content-Type': 'application/json',
					...mockTlsTermination
				}
			}
		).then(handleResponse);
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
		rejectLoginRequest: function (challenge) {
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
		introspectOAuth2Token: (token, scope) => fetch(
			uj(hydraUrl, '/oauth2/introspect'),
			{
				method: 'POST',
				body: `token=${token}&scope=${scope}`,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					...mockTlsTermination
				}
			}
		).then(handleResponse),
		isInstanceAlive: () => fetch(uj(hydraUrl, '/health/alive')),
		listOAuth2Clients: () => fetch(uj(hydraUrl, '/clients'),
			{
				headers: {
					...mockTlsTermination
				}
			}).then(handleResponse),
		createOAuth2Client: (data) => fetch(uj(hydraUrl, '/clients'),
			{
				method: 'POST',
				body: JSON.stringify(data),
				headers: {
					'Content-Type': 'application/json',
					...mockTlsTermination
				}
			}
		).then(handleResponse),
		deleteOAuth2Client: (id) => fetch(uj(hydraUrl, `/clients/${id}`),
			{
				method: 'DELETE',
				headers: {
					...mockTlsTermination
				}
			}
		)
	};
}
