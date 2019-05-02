const logger = require('winston');

const removeTeamNews = (app, newsService) => async (deletedTeam) => {
	try {
		await newsService.remove(null, {
			query: {
				target: deletedTeam._id,
				targetModel: 'teams',
			},
		});
	} catch (e) {
		logger.warn(`Cannot remove news for team ${deletedTeam._id}`, e);
	}
};

const configure = (app) => {
	const newsService = app.service('news');
	app.service('teams').on('removed', removeTeamNews(app, newsService));
};

module.exports = {
	configure,
};
