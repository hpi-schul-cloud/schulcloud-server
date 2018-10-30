// const hooks = require("./hooks"); // TODO: oauth permissions
const Hydra = require('ory-hydra-sdk');
const logger = require('winston');

const resolver = (resolve, reject) => (error, data, response) => {
	if (error)
		reject(error);
	else if (response.statusCode < 200 || response.statusCode >= 400)
		reject(new Error('Endpoint gave status code ' + response.statusCode));
	else
		resolve(data);
};

module.exports = function() {
	const app = this;
	const hydraConfig = app.settings.services.hydra
	Hydra.ApiClient.instance.basePath = hydraConfig.adminUrl
	Hydra.ApiClient.instance.defaultHeaders = {
		'X-Forwarded-Proto': 'https'
	}

	// check Hydra Health
	const healthApiInstance = new Hydra.HealthApi();
	healthApiInstance.isInstanceAlive((error, data, response) => {
		if (error) {
			logger.log('warn', 'Hydra got a problem: ' + error);
		} else {
			logger.log('info', 'Hydra status is: ' + data.status);
		}
	});

	const oAuth2ApiInstance = new Hydra.OAuth2Api();

	app.use('/oauth2/clients', {
		find (params) {
			return new Promise((resolve, reject) => {
				oAuth2ApiInstance.listOAuth2Clients(params, resolver(resolve, reject));
			});
		},
		create (data) {
			data.scope = data.scope || 'openid offline';
			data.grant_types = data.grant_types || ['authorization_code' ,'refresh_token'];
			data.response_types = data.response_types || ['code', 'token', 'id_token'];
			data.redirect_uris = data.redirect_uris || [];
			return new Promise((resolve, reject) => {
				oAuth2ApiInstance.createOAuth2Client(data, resolver(resolve, reject));
			});
		},
		remove (id) {
			return new Promise((resolve, reject) => {
				oAuth2ApiInstance.deleteOAuth2Client(id, resolver(resolve, reject));
			});
		}
	});

	app.use('/oauth2/loginRequest', {
		get (challenge) {
			return new Promise((resolve, reject) => {
				oAuth2ApiInstance.getLoginRequest(challenge, resolver(resolve, reject));
			});
		},
		patch (challenge, body, params) {
			return new Promise((resolve, reject) => {
				if (params.query.accept) {
					oAuth2ApiInstance.acceptLoginRequest(challenge, {body}, resolver(resolve, reject));
				} else if (params.query.reject) {
					oAuth2ApiInstance.rejectLoginRequest(challenge, {body}, resolver(resolve, reject));
				}
			});
		}
	});

	app.use('/oauth2/consentRequest', {
		get (challenge) {
			return new Promise((resolve, reject) => {
				oAuth2ApiInstance.getConsentRequest(challenge, resolver(resolve, reject));
			});
		},
		patch (challenge, body, params) {
			return new Promise((resolve, reject) => {
				if (params.query.accept) {
					oAuth2ApiInstance.acceptConsentRequest(challenge, {body}, resolver(resolve, reject))
				} else if (params.query.reject) {
					oAuth2ApiInstance.rejectLoginRequest(challenge, {body}, resolver(resolve, reject));
				}

			});
		}
	});
}
