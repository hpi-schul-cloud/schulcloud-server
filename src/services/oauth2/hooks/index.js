const auth = require('@feathersjs/authentication');
const errors = require('@feathersjs/errors');
const globalHooks = require('../../../hooks');
const Hydra = require('../hydra.js');

const properties = 'title="username" style="height: 26px; width: 180px; border: none;"';
const iframeSubject = (pseudonym, url) => `<iframe src="${url}/oauth2/username/${pseudonym}" ${properties}></iframe>`;

exports.getSubject = iframeSubject;

const setSubject = hook => {
	if (!hook.params.query.accept) return hook;
	return hook.app.service('ltiTools').find({
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

exports.hooks = {
	clients: {
		before: {
			all: [
				auth.hooks.authenticate('jwt'),
				globalHooks.ifNotLocal(globalHooks.isSuperHero())
			],
		},
	},
	loginRequest: {
		before: {
			patch: [auth.hooks.authenticate('jwt'), injectLoginRequest, setSubject],
		},
	},
	consentRequest: {
		before: {
			all: [auth.hooks.authenticate('jwt')],
			patch: [injectConsentRequest, validateSubject],
		},
	},
	introspect: {
		before: {
			create: [globalHooks.ifNotLocal(() => { throw new errors.MethodNotAllowed(); })],
		},
	},
	consentSessions: {
		before: {
			all: [auth.hooks.authenticate('jwt'), managesOwnConsents],
		},
	},
};
