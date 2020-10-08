const reqlib = require('app-root-path').require;

const { BadRequest } = reqlib('src/errors');
const oauth2 = require('../../oauth2/hooks');

module.exports = {
	tokenIsActive: (context) =>
		context.app
			.service('/oauth2/introspect')
			.create({ token: context.params.headers.authorization.replace('Bearer ', '') })
			.then((introspection) => {
				if (introspection.active) {
					context.params.tokenInfo = introspection;
					return context;
				}
				throw new BadRequest('Access token invalid');
			})
			.catch((error) => {
				throw new Error(error);
			}),

	userIsMatching: (context) => {
		if (
			context.params.tokenInfo.obfuscated_subject === decodeURIComponent(context.params.route.user) ||
			context.params.tokenInfo.sub === context.params.user
		) {
			return context;
		}
		throw new BadRequest('No permissions for the user');
	},

	stripIframe: (context) => {
		const regEx = /oauth2\/username\/(.*?)"/;
		const pseudonym = context.params.route.user;
		context.params.pseudonym = pseudonym.includes('iframe') ? pseudonym.match(regEx)[1] : pseudonym;
		return context;
	},

	injectOriginToolIds: (context) => {
		if (!context.params.tokenInfo) throw new Error('Token info is missing in params'); // first call isTokenActive
		const toolService = context.app.service('ltiTools');
		return toolService
			.find({
				query: {
					oAuthClientId: context.params.tokenInfo.client_id,
					isLocal: true,
				},
			})
			.then((originTools) =>
				toolService
					.find({
						query: {
							originTool: originTools.data[0]._id,
						},
					})
					.then((tools) => {
						context.params.toolIds = [originTools.data[0]._id]; // don't forget actual requested tool id
						context.params.toolIds = context.params.toolIds.concat(tools.data.map((tool) => tool._id));
						return context;
					})
			);
	},

	groupContainsUser: (context) => {
		if (!context.result.data) return context;
		const users = context.result.data.students.concat(context.result.data.teachers);
		if (
			users.find(
				(user) =>
					user.user_id ===
						oauth2.getSubject(context.params.tokenInfo.obfuscated_subject, context.app.settings.services.web) ||
					user.user_id === context.params.tokenInfo.obfuscated_subject
			)
		)
			return context;
		throw new BadRequest('Current user is not part of group');
	},
};
