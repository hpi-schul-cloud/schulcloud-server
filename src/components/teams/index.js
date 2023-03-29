const setupTeamFacade = require('./uc/teams.facade');

module.exports = (app) => {
	app.configure(setupTeamFacade);
};
