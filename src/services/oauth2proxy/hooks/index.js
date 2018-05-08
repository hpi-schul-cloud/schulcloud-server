exports.before = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: hook => {
		return hook.app.service('ltiTools').find({
			query: {
				oAuthClientId: hook.data.clientId
			}
		}).then(tools => {
			return hook.app.service('pseudonym').find({
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
