const auth = require('feathers-authentication');
const hooks = require("./hooks"); // TODO: oauth permissions
const Hydra = require('./hydra.js');
const logger = require('winston');

module.exports = function() {
	const app = this;
	const hydra = Hydra(app.settings.services.hydra.adminUrl);

	// hydra.isInstanceAlive()
	// 	.then(res => { logger.log('info', 'Hydra status is: ' + res.statusText) })
	// 	.catch(error => { logger.log('warn', 'Hydra got a problem: ' + error) });

	app.use('/oauth2/clients', {
		find (params) {
			return hydra.listOAuth2Clients(params);
		},
		create (data) {
			data.subject_type = 'pairwise';
			data.scope = data.scope || 'openid offline';
			data.grant_types = data.grant_types || ['authorization_code' ,'refresh_token'];
			data.response_types = data.response_types || ['code', 'token', 'id_token'];
			data.redirect_uris = data.redirect_uris || [];
			return hydra.createOAuth2Client(data);
		},
		remove (id) {
			return hydra.deleteOAuth2Client(id);
		}
	});

	app.use('/oauth2/loginRequest', {
		get (challenge) {
			return hydra.getLoginRequest(challenge);
		},
		patch (challenge, body, params) {
			return (params.query.accept
				? hydra.acceptLoginRequest(challenge, body)
				: hydra.rejectLoginRequest(challenge, body)
			);
		}
	});

	app.service('/oauth2/loginRequest').before({
		patch: [
			auth.hooks.authenticate('jwt'),
			hooks.setSubject
		]
	})

	app.use('/oauth2/consentRequest', {
		get (challenge) {
			return hydra.getConsentRequest(challenge);
		},
		patch (challenge, body, params) {
			return (params.query.accept
				? hydra.acceptConsentRequest(challenge, body)
				: hydra.rejectConsentRequest(challenge, body)
			);
		}
	});

	app.use('/oauth2/introspect', {
		create (data) {
			return hydra.introspectOAuth2Token(data.token, 'openid');
		}
	});
}
