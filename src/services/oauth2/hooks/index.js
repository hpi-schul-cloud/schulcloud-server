/* eslint-disable promise/no-nesting */
const { authenticate } = require('@feathersjs/authentication');

const { Forbidden, MethodNotAllowed } = require('../../../errors');
const globalHooks = require('../../../hooks');
const Hydra = require('../hydra');

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
		.then((tools) => {
			if (!tools.data || !Array.isArray(tools.data) || tools.data.length !== 1) {
				throw new Error(
					`Unable to find a singular LtiTool with client_id ${hook.params.loginRequest.client.client_id} for login request. ` +
						'If you are trying to use a CTL-Tool, please use the v3+ endpoints.'
				);
			}

			return hook.app
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
				});
		});
};

const setIdToken = (hook) => {
	const scope = hook.params.consentRequest.requested_scope;
	if (!hook.params.query.accept) return hook;
	return Promise.all([
		hook.app.service('users').get(hook.params.account.userId),
		scope.includes('groups')
			? hook.app.service('teams').find(
					{
						query: {
							'userIds.userId': hook.params.account.userId,
						},
					},
					'_id name'
			  )
			: undefined,
		hook.app.service('ltiTools').find({
			query: {
				oAuthClientId: hook.params.consentRequest.client.client_id,
				isLocal: true,
			},
		}),
	]).then(([user, userTeams, tools]) =>
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
				hook.data.session = {
					id_token: {
						iframe: iframeSubject(pseudonym, hook.app.settings.services.web),
						email: scope.includes('email') ? user.email : undefined,
						name: scope.includes('profile') ? name : undefined,
						userId: scope.includes('profile') ? user._id : undefined,
						schoolId: user.schoolId,
						groups: scope.includes('groups')
							? userTeams.data.map((team) => {
									return {
										gid: team._id,
										displayName: team.name,
									};
							  })
							: undefined,
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

// TODO N21-91. Magic Strings are not desireable
const validatePermissionForNextcloud = (hook) =>
	Promise.all([
		hook.app.service('users').get(hook.params.account.userId),
		hook.app.service('ltiTools').find({
			query: {
				oAuthClientId: hook.params.loginRequest.client.client_id,
				isLocal: true,
			},
		}),
	]).then(([user, tools]) => {
		const filtredToolsData = tools.data.filter((toolData) => toolData.name === 'SchulcloudNextcloud');
		if (
			filtredToolsData.length > 0 &&
			filtredToolsData[0].name === 'SchulcloudNextcloud' &&
			!user.permissions.includes('NEXTCLOUD_USER')
		) {
			throw new Forbidden('You are not allowed to use Nextcloud');
		}
		return hook;
	});

exports.setIdToken = setIdToken;
exports.validatePermissionForNextcloud = validatePermissionForNextcloud;

exports.hooks = {
	clients: {
		before: {
			all: [authenticate('jwt'), globalHooks.ifNotLocal(globalHooks.isSuperHero())],
		},
	},
	loginRequest: {
		before: {
			patch: [authenticate('jwt'), injectLoginRequest, setSubject, validatePermissionForNextcloud],
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
	logoutRequest: {
		before: {
			patch: [authenticate('jwt')],
		},
	},
};
