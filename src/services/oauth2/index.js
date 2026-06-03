const { Configuration } = require('@hpi-schul-cloud/commons');

const hooks = require('./hooks');
const Hydra = require('./hydra.js');

module.exports = function oauth2() {
	const hydraUri = Configuration.get('HYDRA_URI');
	const hydraUser = Configuration.has('HYDRA_ADMIN_USER') ? Configuration.get('HYDRA_ADMIN_USER') : undefined;
	const hydraPassword = Configuration.has('HYDRA_ADMIN_PASSWORD')
		? Configuration.get('HYDRA_ADMIN_PASSWORD')
		: undefined;

	const app = this;
	const hydraAdmin = Hydra(hydraUri, { user: hydraUser, password: hydraPassword });

	app.use('/oauth2/introspect', {
		create(data) {
			return hydraAdmin.introspectOAuth2Token(data.token, 'openid');
		},
	});
	app.service('/oauth2/introspect').hooks(hooks.hooks.introspect);
};
