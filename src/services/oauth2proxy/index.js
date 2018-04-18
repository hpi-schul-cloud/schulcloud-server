const hooks = require("./hooks");
const Hydra = require('ory-hydra-sdk')
const OAuth2 = require('simple-oauth2')
const qs = require('querystring')

const resolver = (resolve, reject) => (error, data, response) => {
	if (error) {
		return reject(error)
	} else if (response.statusCode < 200 || response.statusCode >= 400) {
		return reject(new Error('Consent endpoint gave status code ' + response.statusCode + ', but status code 200 was expected.'))
	}

	resolve(data)
}

module.exports = function() {
	const app = this;

	const scope = 'hydra.consent hydra.introspect'
	const hydraConfig =  app.settings.services.hydra

	Hydra.ApiClient.instance.basePath = hydraConfig.host + hydraConfig.path

	const hydra = new Hydra.OAuth2Api()

	const oauth2 = OAuth2.create({
		client: {
			id: qs.escape(hydraConfig.clientId),
			secret: qs.escape(hydraConfig.clientSecret)
		},
		auth: {
			tokenHost: hydraConfig.host,
			authorizePath: hydraConfig.path + '/oauth2/auth',
			tokenPath: hydraConfig.path + '/oauth2/token'
		},
		options: {
			useBodyAuth: false,
			useBasicAuthorizationHeader: true
		}
	})

	const refreshToken = () => oauth2.clientCredentials
		.getToken({ scope })
		.then((result) => {
			const token = oauth2.accessToken.create(result);
			const hydraClient = Hydra.ApiClient.instance;
			hydraClient.authentications.oauth2.accessToken = token.token.access_token;
			return Promise.resolve(token);
		})
		.catch((error) => {
			console.log('Could not refresh access token: ' + error.message);
		});

	refreshToken().then()

	app.use('/oauth2proxy/consentRequest', {
		get(id) {
			return new Promise((resolve, reject) =>
				refreshToken().then(() => {
					hydra.getOAuth2ConsentRequest(id, resolver(consentRequest => {
						resolve(consentRequest);
					}))
				})
			);
		},
		patch(id, data) {
			return new Promise((resolve, reject) =>
				refreshToken().then(() => {
					hydra.getOAuth2ConsentRequest(id, resolver(consentRequest => {
						hydra.acceptOAuth2ConsentRequest(
							id,
							data,
							resolver(_ => resolve(consentRequest))
						)
					}))
				})
			)
		}
	});

	// check if token is valid
	app.use('/oauth2proxy/introspect', {
		create(data) {
			const { token } = data
			return new Promise((resolve, reject) =>
				refreshToken().then(() => {
					hydra.introspectOAuth2Token(token, {'scope': "openid"},
					resolver(introspection => { resolve(introspection) },
					error => {
						console.log(error)
						resolve(false)
					}))
				})
			);
		}
	});

	// Get our initialize service to that we can bind hooks
	const consentService = app.service('/oauth2proxy/consentRequest');

	// Set up our before hooks
	consentService.before(hooks.before);

	// Set up our after hooks
	consentService.after(hooks.after);
}
