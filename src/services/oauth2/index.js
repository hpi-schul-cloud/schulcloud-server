const hooks = require('./hooks');
const Hydra = require('./hydra.js');

module.exports = function oauth2() {
	const app = this;
	const hydra = Hydra(app.settings.services.hydra);

	// hydra.isInstanceAlive()
	// 	.then(res => { logger.log('info', 'Hydra status is: ' + res.statusText) })
	// 	.catch(error => { logger.log('warn', 'Hydra got a problem: ' + error) });

	app.use('/oauth2/clients', {
		find(params) {
			return hydra.listOAuth2Clients(params);
		},
		create(data) {
			data.scope = data.scope || 'openid offline';
			data.grant_types = data.grant_types || ['authorization_code', 'refresh_token'];
			data.response_types = data.response_types || ['code', 'token', 'id_token'];
			data.redirect_uris = data.redirect_uris || [];
			return hydra.createOAuth2Client(data);
		},
		remove(id) {
			return hydra.deleteOAuth2Client(id);
		},
	});
	app.service('/oauth2/clients').before(hooks.before.clients);

	app.use('/oauth2/loginRequest', {
		get(challenge) {
			return hydra.getLoginRequest(challenge);
		},
		patch(challenge, body, params) {
			return (params.query.accept
				? hydra.acceptLoginRequest(challenge, body)
				: hydra.rejectLoginRequest(challenge, body)
			);
		},
	});
	app.service('/oauth2/loginRequest').before(hooks.before.loginRequest);

	app.use('/oauth2/consentRequest', {
		get(challenge) {
			return hydra.getConsentRequest(challenge);
		},
		patch(challenge, body, params) {
			return (params.query.accept
				? hydra.acceptConsentRequest(challenge, body)
				: hydra.rejectConsentRequest(challenge, body)
			);
		},
	});
	app.service('/oauth2/consentRequest').before(hooks.before.consentRequest);

	app.use('/oauth2/introspect', {
		create(data) {
			return hydra.introspectOAuth2Token(data.token, 'openid');
		},
	});
	app.service('/oauth2/introspect').before(hooks.before.introspect);

	app.use('/oauth2/auth/sessions/consent', {
		get(user, params) {
			return hydra.listConsentSessions(user);
		},
		remove(user, params) {
			return hydra.revokeConsentSession(user, params.query.client);
		},
	});
	app.service('/oauth2/auth/sessions/consent').before(hooks.before.consentSessions);
};
