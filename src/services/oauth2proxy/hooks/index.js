exports.before = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: async hook => {
		let toolService = hook.app.service('ltiTools');
		return toolService.find({
			query: {
				oAuthClientId: hook.data.clientId
			}
		}).then(tools => {
			let pseudoService = hook.app.service('pseudonym');
			return pseudoService.find({
				query: {
					toolId: tools.data[0]._id,
					userId: hook.data.subject
				}
			}).then(pseudonyms => {
				hook.data.subject = pseudonyms.data[0].token
				return hook
			})
		});
	},
	remove: []
};

exports.after = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [],
	remove: []
};
