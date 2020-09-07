const request = require('request-promise-native');

const mockTlsTermination = {
	'X-Forwarded-Proto': 'https',
};

module.exports = (hydraUrl) => {
	function get(flow, challenge) {
		const options = {
			uri: `${hydraUrl}/oauth2/auth/requests/${flow}?${flow}_challenge=${challenge}`,
			headers: {
				...mockTlsTermination,
			},
			json: true,
		};
		return request(options);
	}

	function put(flow, action, challenge, body) {
		const options = {
			uri: `${hydraUrl}/oauth2/auth/requests/${flow}/${action}?${flow}_challenge=${challenge}`,
			method: 'PUT',
			body,
			headers: {
				...mockTlsTermination,
			},
			json: true,
		};
		return request(options);
	}

	return {
		// Fetches information on a login request.
		getLoginRequest(challenge) {
			return get('login', challenge);
		},
		// Accepts a login request.
		acceptLoginRequest(challenge, body) {
			return put('login', 'accept', challenge, body);
		},
		// Rejects a login request.
		rejectLoginRequest(challenge, body) {
			return put('login', 'reject', challenge, body);
		},
		// Fetches information on a consent request.
		getConsentRequest(challenge) {
			return get('consent', challenge);
		},
		// Accepts a consent request.
		acceptConsentRequest(challenge, body) {
			return put('consent', 'accept', challenge, body);
		},
		// Rejects a consent request.
		rejectConsentRequest(challenge, body) {
			return put('consent', 'reject', challenge, body);
		},
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
		isInstanceAlive: () =>
			request({
				uri: `${hydraUrl}/health/alive`,
			}),
		listOAuth2Clients: () =>
			request({
				uri: `${hydraUrl}/clients`,
				headers: {
					...mockTlsTermination,
				},
			}),
		createOAuth2Client: (data) =>
			request({
				uri: `${hydraUrl}/clients`,
				method: 'POST',
				body: data,
				headers: {
					...mockTlsTermination,
				},
				json: true,
			}),
		getOAuth2Client: (id) =>
			request({
				uri: `${hydraUrl}/clients/${id}`,
				method: 'GET',
				headers: {
					...mockTlsTermination,
				},
			}),
		updateOAuth2Client: (id, data) =>
			request({
				uri: `${hydraUrl}/clients/${id}`,
				method: 'PUT',
				body: data,
				json: true,
				headers: {
					...mockTlsTermination,
				},
			}),
		deleteOAuth2Client: (id) =>
			request({
				uri: `${hydraUrl}/clients/${id}`,
				method: 'DELETE',
				headers: {
					...mockTlsTermination,
				},
			}),
		listConsentSessions: (user) =>
			request({
				uri: `${hydraUrl}/oauth2/auth/sessions/consent?subject=${user}`,
				headers: {
					...mockTlsTermination,
				},
			}),
		revokeConsentSession: (user, client) =>
			request({
				uri: `${hydraUrl}/oauth2/auth/sessions/consent?subject=${user}&client=${client}`,
				method: 'DELETE',
				headers: {
					...mockTlsTermination,
				},
			}),
	};
};
