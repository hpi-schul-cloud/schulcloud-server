const auth = require('feathers-authentication');
const errors = require('feathers-errors');
const globalHooks = require('../../../hooks');
const Hydra = require('../hydra.js');

const iframeSubject = (pseudonym, clientUrl) => `<iframe title="username" src="${clientUrl}/oauth2/username/${pseudonym}" style="height: 26px; width: 180px; border: none;"></iframe>`

exports.getSubject = iframeSubject;

const setSubject = hook => {
	return hook.app.service('ltiTools').find({
		query: {
			oAuthClientId: hook.params.loginRequest.client.client_id
		}
	}).then(tools => {
		return hook.app.service('pseudonym').find({
			query: {
				toolId: tools.data[0]._id,
				userId: hook.params.account.userId
			}
		}).then(pseudonyms => {
			const pseudonym = pseudonyms.data[0].pseudonym;
			hook.data.subject = pseudonym;
			if (tools.data[0].useIframePseudonym) {
				hook.data.force_subject_identifier = iframeSubject(pseudonym, hook.app.settings.services.web);
			}
			return hook
		})
	});
};

const injectLoginRequest = hook => {
	return Hydra(hook.app.settings.services.hydra).getLoginRequest(hook.id).then(loginRequest => {
		hook.params.loginRequest = loginRequest;
		return hook;
	});
}

const injectConsentRequest = hook => {
	return Hydra(hook.app.settings.services.hydra).getConsentRequest(hook.id).then(consentRequest => {
		hook.params.consentRequest = consentRequest;
		return hook;
	});
}

const validateSubject = hook => {
	return hook.app.service('ltiTools').find({
		query: {
			oAuthClientId: hook.params.consentRequest.client.client_id
		}
	}).then(tools => {
		return hook.app.service('pseudonym').find({
			query: {
				toolId: tools.data[0]._id,
				userId: hook.params.account.userId
			}
		}).then(pseudonyms => {
			const pseudonym = pseudonyms.data[0].pseudonym;
			if (hook.params.consentRequest.subject === pseudonym) return hook
			throw new errors.Forbidden("You want to patch another user's consent");
		})
	});
}

exports.before = {
	clients: {
		all: [auth.hooks.authenticate('jwt'), globalHooks.isSuperHero()]
	},
	loginRequest: {
		patch: [auth.hooks.authenticate('jwt'), injectLoginRequest, setSubject]
	},
	consentRequest: {
		all: [auth.hooks.authenticate('jwt')],
		patch: [injectConsentRequest, validateSubject]
	},
	introspect: {
		create: [globalHooks.ifNotLocal(_ => {throw new errors.MethodNotAllowed();})],
	}
};
