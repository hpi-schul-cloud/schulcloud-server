const auth = require('feathers-authentication');
const errors = require('feathers-errors');
const globalHooks = require('../../../hooks');
const Hydra = require('../hydra.js');

const properties = 'title="username" style="height: 26px; width: 180px; border: none;"';
const iframeSubject = (pseudonym, url) => `<iframe src="${url}/oauth2/username/${pseudonym}" ${properties}></iframe>`;

exports.getSubject = iframeSubject;

const setSubject = hook => {
	if (!hook.params.query.accept) return hook;
	hook.app.service('ltiTools').find({
		query: {
			oAuthClientId: hook.params.loginRequest.client.client_id,
		},
	}).then(tools => hook.app.service('pseudonym').find({
		query: {
			toolId: tools.data[0]._id,
			userId: hook.params.account.userId,
		},
	}).then((pseudonyms) => {
		const {pseudonym} = pseudonyms.data[0];
		if (!hook.data) hook.data = {};
		hook.data.subject = hook.params.account.userId;
		if (tools.data[0].useIframePseudonym) {
			hook.data.force_subject_identifier = iframeSubject(pseudonym, hook.app.settings.services.web);
		} else {
			hook.data.force_subject_identifier = pseudonym;
		}
		return hook;
	}));
}

const injectLoginRequest = hook => Hydra(hook.app.settings.services.hydra).getLoginRequest(hook.id)
	.then((loginRequest) => {
		hook.params.loginRequest = loginRequest;
		return hook;
	});

const injectConsentRequest = hook => Hydra(hook.app.settings.services.hydra).getConsentRequest(hook.id)
	.then((consentRequest) => {
		hook.params.consentRequest = consentRequest;
		return hook;
	});

const validateSubject = (hook) => {
	if (hook.params.consentRequest.subject === hook.params.account.userId.toString()) return hook;
	throw new errors.Forbidden("You want to patch another user's consent");
};

const managesOwnConsents = (hook) => {
	if (hook.id === hook.params.account.userId.toString()) return hook;
	throw new errors.Forbidden("You want to manage another user's consents");
};

exports.before = {
	clients: {
		all: [
			auth.hooks.authenticate('jwt'),
			globalHooks.ifNotLocal(globalHooks.isSuperHero())
		],
	},
	loginRequest: {
		patch: [auth.hooks.authenticate('jwt'), injectLoginRequest, setSubject],
	},
	consentRequest: {
		all: [auth.hooks.authenticate('jwt')],
		patch: [injectConsentRequest, validateSubject],
	},
	introspect: {
		create: [globalHooks.ifNotLocal(() => { throw new errors.MethodNotAllowed(); })],
	},
	consentSessions: {
		all: [auth.hooks.authenticate('jwt'), managesOwnConsents],
	},
};
