const teams = require('./teams');
const testSystem = require('./testSystem');
const login = require('./login');

module.exports = (app, opt) => ({
	teams: teams(app, opt),
	testSystem: testSystem(app, opt),
	login: login(app, opt),
});
