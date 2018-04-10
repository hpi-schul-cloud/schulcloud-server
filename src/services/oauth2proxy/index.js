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

class ConsentService {
	constructor(opts) {
		this.options = opts;
		this.app	 = null;
	}

	refreshToken() {
		return this.oauth2.clientCredentials
			.getToken({ scope: this.scope })
			.then((result) => {
				const token = this.oauth2.accessToken.create(result);
				const hydraClient = Hydra.ApiClient.instance;
				hydraClient.authentications.oauth2.accessToken = token.token.access_token;
				return Promise.resolve(token);
			})
			.catch((error) => {
				console.log('Could not refresh access token' + error.message);
			});
	}

	get(id) {
		return new Promise((resolve, reject) =>
			this.refreshToken().then(() => {
				this.hydra.getOAuth2ConsentRequest(id, resolver(consentRequest => {
					resolve(consentRequest);
				}))
			})
		);
	}

	patch(id, data) {
		return new Promise((resolve, reject) =>
			this.refreshToken().then(() => {
				this.hydra.getOAuth2ConsentRequest(id, resolver(consentRequest => {
					this.hydra.acceptOAuth2ConsentRequest(
						id,
						data,
						resolver(_ => resolve(consentRequest))
					)
				}))
			})
		)
	}

	setup(app, path) {
		this.app = app;
		this.scope = 'hydra.consent'

		Hydra.ApiClient.instance.basePath = app.settings.services.hydra.url

		this.hydra = new Hydra.OAuth2Api()

		this.oauth2 = OAuth2.create({
			client: {
				id: qs.escape(app.settings.services.hydra.clientId),
				secret: qs.escape(app.settings.services.hydra.clientSecret)
			},
			auth: {
				tokenHost: Hydra.ApiClient.instance.basePath,
				authorizePath: '/oauth2/auth',
				tokenPath: '/oauth2/token'
			},
			options: {
				useBodyAuth: false,
				useBasicAuthorizationHeader: true
			}
		})

		this.refreshToken().then()
	}
}

module.exports = function() {
	const app = this;

	app.use('/oauth2proxy/consentRequest/', new ConsentService());

	// Get our initialize service to that we can bind hooks
	const consentService = app.service('/oauth2proxy/consentRequest');

	// Set up our before hooks
	consentService.before(hooks.before);

	// Set up our after hooks
	consentService.after(hooks.after);
}
