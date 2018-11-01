const errors = require('feathers-errors');

module.exports = {

	tokenIsActive: context => {
		return context.app.service('/oauth2/introspect')
			.create({token: context.params.headers.authorization.replace('Bearer ', '')})
			.then(introspection => {
				if (introspection.active) {
					context.params.tokenInfo = introspection
					return context
				}
				throw new errors.BadRequest('Access token invalid')
			}).catch(error => {
				throw new Error(error)
			})
	},

	userIsMatching: context => {
		if (context.params.tokenInfo.obfuscated_subject === decodeURIComponent(context.params.user)) {
			return context
		} else {
			throw new errors.BadRequest('No permissions for the user')
		}
	},

	injectOriginToolIds: context => {
		if (!context.params.tokenInfo) throw new Error('Token info is missing in params') // first call isTokenActive
		const toolService = context.app.service("ltiTools");
		return toolService.find({
			query: {
				oAuthClientId: context.params.tokenInfo.client_id
			}
		}).then(originTools => {
			return toolService.find({
				query: {
					originTool: originTools.data[0]._id
				}
			}).then(tools => {
				context.params.toolIds = [originTools.data[0]._id] // don't forget actual requested tool id
				context.params.toolIds = context.params.toolIds.concat(tools.data.map(tool => tool._id)) // all origin tool ids
				return context
			});
		});
	},

	groupContainsUser: context => {
		if (!context.result.data) return context
		if (context.result.data.students
				.concat(context.result.data.teachers)
				.find(user => (user.user_id === context.params.tokenInfo.sub))) {
			return context
		}
		throw new errors.BadRequest("Current user is not part of group")
	}
};
