const setSubject = hook => {
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
			const pseudonym = pseudonyms.data[0].token;
			const iframe = `<iframe title="username" src="https://bp.schul-cloud.org/account/username/${pseudonym}" 
style="height: 26px; width: 180px; border: none;"></iframe>`;
			hook.data.subject = iframe;
			return hook
		})
	});
}

exports.before = {
	all: [],
	find: [],
	get: [],
	create: [],
	update: [],
	patch: [setSubject],
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
