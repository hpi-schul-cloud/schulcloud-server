const { authenticate } = require('@feathersjs/authentication');
const reqlib = require('app-root-path').require;

const { Forbidden, MethodNotAllowed } = reqlib('src/errors');
const globalHooks = require('../../../hooks');
const Hydra = require('../hydra.js');

const properties = 'title="username" style="height: 26px; width: 180px; border: none;"';
const iframeSubject = (pseudonym, url) => `<iframe src="${url}/oauth2/username/${pseudonym}" ${properties}></iframe>`;

exports.getSubject = iframeSubject;

const setSubject = (hook) => {
	if (!hook.params.query.accept) return hook;
	return hook.app
		.service('ltiTools')
		.find({
			query: {
				oAuthClientId: hook.params.loginRequest.client.client_id,
				isLocal: true,
			},
		})
		.then((tools) =>
			hook.app
				.service('pseudonym')
				.find({
					query: {
						toolId: tools.data[0]._id,
						userId: hook.params.account.userId,
					},
				})
				.then((pseudonyms) => {
					const { pseudonym } = pseudonyms.data[0];
					if (!hook.data) hook.data = {};
					hook.data.subject = hook.params.account.userId;
					hook.data.force_subject_identifier = pseudonym;
				})
		);
};

const setIdToken = (hook) => {
	if (!hook.params.query.accept) return hook;
	return Promise.all([
		hook.app.service('users').get(hook.params.account.userId),
		hook.app.service('ltiTools').find({
			query: {
				oAuthClientId: hook.params.consentRequest.client.client_id,
				isLocal: true,
			},
		}),
	]).then(([user, tools]) =>
		hook.app
			.service('pseudonym')
			.find({
				query: {
					toolId: tools.data[0]._id,
					userId: hook.params.account.userId,
				},
			})
			.then((pseudonyms) => {
				const { pseudonym } = pseudonyms.data[0];
				const name = user.displayName ? user.displayName : `${user.firstName} ${user.lastName}`;
				const scope = hook.params.consentRequest.requested_scope;
				hook.data.session = {
					id_token: {
						iframe: iframeSubject(pseudonym, hook.app.settings.services.web),
						email: scope.includes('email') ? user.email : undefined,
						name: scope.includes('profile') ? name : undefined,
						userId: scope.includes('profile') ? user._id : undefined,
						schoolId: user.schoolId,
					},
				};
				return hook;
			})
	);
};

const injectLoginRequest = (hook) =>
	Hydra(hook.app.settings.services.hydra)
		.getLoginRequest(hook.id)
		.then((loginRequest) => {
			hook.params.loginRequest = loginRequest;
			return hook;
		});

const injectConsentRequest = (hook) =>
	Hydra(hook.app.settings.services.hydra)
		.getConsentRequest(hook.id)
		.then((consentRequest) => {
			hook.params.consentRequest = consentRequest;
			return hook;
		});

const validateSubject = (hook) => {
	if (hook.params.consentRequest.subject === hook.params.account.userId.toString()) return hook;
	throw new Forbidden("You want to patch another user's consent");
};

const managesOwnConsents = (hook) => {
	if (hook.id === hook.params.account.userId.toString()) return hook;
	throw new Forbidden("You want to manage another user's consents");
};

exports.hooks = {
	clients: {
		before: {
			all: [authenticate('jwt'), globalHooks.ifNotLocal(globalHooks.isSuperHero())],
		},
	},
	loginRequest: {
		before: {
			patch: [authenticate('jwt'), injectLoginRequest, setSubject],
		},
	},
	consentRequest: {
		before: {
			all: [authenticate('jwt')],
			patch: [injectConsentRequest, validateSubject, setIdToken],
		},
	},
	introspect: {
		before: {
			create: [
				globalHooks.ifNotLocal(() => {
					throw new MethodNotAllowed();
				}),
			],
		},
	},
	consentSessions: {
		before: {
			all: [authenticate('jwt'), managesOwnConsents],
		},
	},
};
