// const hooks = require("./hooks");
const Hydra = require('ory-hydra-sdk')
// const OAuth2 = require('simple-oauth2')
const qs = require('querystring')
const logger = require('winston');

// const resolver = (resolve, reject) => (error, data, response) => {
// 	if (error) {
// 		return reject(error)
// 	} else if (response.statusCode < 200 || response.statusCode >= 400) {
// 		return reject(new Error('Consent endpoint gave status code ' + response.statusCode + ', but status code 200 was expected.'))
// 	}
// 	resolve(data)
// }

module.exports = function() {
	const app = this;
	const hydraConfig = app.settings.services.hydra
	Hydra.ApiClient.instance.basePath = hydraConfig.adminUrl
	Hydra.ApiClient.instance.defaultHeaders = {
		'X-Forwarded-Proto': 'https'
	}

	// check Hydra Health
	const healthApiInstance = new Hydra.HealthApi();
	//console.log(healthApiInstance.getInstanceStatus());
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
				oAuth2ApiInstance.listOAuth2Clients(params, (error, data, response) => {
					if (error) reject(error);
					else resolve(data);
				});
			});
		},

		create (data) {
			data.scope = data.scope || 'openid offline';
			data.grant_types = data.grant_types || ['authorization_code' ,'refresh_token'];
			data.response_types = data.response_types || ['code', 'token', 'id_token'];
			data.redirect_uris = data.redirect_uris || [];
			return new Promise((resolve, reject) => {
				oAuth2ApiInstance.createOAuth2Client(data, (error, data, response) => {
					if (error) {
						if (error.status === 409) resolve(response.text)
						else reject(error);
					}
					else resolve(data);
				});
			});
		},

		remove (id, params) {
			return new Promise((resolve, reject) => {
				oAuth2ApiInstance.deleteOAuth2Client(id, (error, data, response) => {
					if (error) reject(error);
					else resolve(data);
				});
			});
		}
	});

	app.use('/oauth2/loginRequest', {
		get (challenge) {
			return new Promise((resolve, reject) => {
				oAuth2ApiInstance.getLoginRequest(challenge, (error, data, response) => {
					if (error) reject(error);
					else resolve(data);
				});
			});
		},

		patch (challenge, data, params) {
			const opts = {
				body: new Hydra.AcceptLoginRequest()
			};

			return new Promise((resolve, reject) => {
				opts.body.subject = data.subject;
				opts.body.remember = data.remember;
				opts.body.remember_for = data.remember_for;
				if (params.query.accept) {
					oAuth2ApiInstance.acceptLoginRequest(challenge, opts, (error, data, response) => {
						if (error) reject(error);
						else resolve(data);
					});
				} else if (params.query.reject) {
					oAuth2ApiInstance.rejectLoginRequest(challenge, opts, (error, data, response) => {
						if (error) reject(error);
						else resolve(data);
					});
				}
			});
		}
	});

	app.use('/oauth2/consentRequest', {
		get (challenge) {
			return new Promise((resolve, reject) => {
				oAuth2ApiInstance.getConsentRequest(challenge, (error, data, response) => {
					if (error) reject(error);
					else resolve(data);
				});
			});
		},

		patch (challenge, data, params) {
			return new Promise((resolve, reject) => {
				oAuth2ApiInstance.acceptConsentRequest(challenge, {body: {grantScopes: data.grantScopes}}, (error, data, response) => {
					if (error) reject(error);
					else resolve(data);
				})
			});
		}
	});
}
