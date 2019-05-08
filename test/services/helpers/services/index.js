const teams = require('./teams');

module.exports = (app, opt) => ({
	teams: teams(app, opt),
});
