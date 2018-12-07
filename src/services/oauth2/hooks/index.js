const getSubject = (pseudonym, clientUrl) => `<iframe title="username" src="${clientUrl}/oauth2/username/${pseudonym}" style="height: 26px; width: 180px; border: none;"></iframe>`

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
				if (tools.data[0].useIframePseudonym) {
					hook.data.force_subject_identifier = getSubject(pseudonym, hook.app.settings.services.web);
				}
				return hook
			})
		});
	},

	getSubject

};
