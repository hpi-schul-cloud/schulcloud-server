module.exports = {

	setSubject: hook => {
		return hook.app.service('ltiTools').find({
			query: {
				oAuthClientId: hook.params.query.clientId
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
				hook.data.force_subject_identifier = `<iframe title="username" src="http://localhost:3031/account/username/${pseudonym}" style="height: 26px; width: 180px; border: none;"></iframe>`
				return hook
			})
		});
	}

};
