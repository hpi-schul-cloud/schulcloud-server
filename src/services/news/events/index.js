const logger = require('../../../logger');

const removeTeamNews = (app) => async (deletedTeam) => {
	try {
		await app.service('/newsModel').remove(null, {
			query: {
				target: deletedTeam._id,
				targetModel: 'teams',
			},
		});
	} catch (e) {
		logger.warning(`Cannot remove news for team ${deletedTeam._id}`, e);
	}
};

const configure = (app) => {
	app.service('teams').on('removed', removeTeamNews(app));
};

module.exports = {
	configure,
};
