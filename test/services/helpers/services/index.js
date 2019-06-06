const teams = require('./teams');
const testSystem = require('./testSystem');
const login = require('./login');
const classes = require('./classes');
const users = require('./users');
const courses = require('./courses');
const accounts = require('./accounts');

module.exports = (app, opt) => ({
	teams: teams(app, opt),
	testSystem: testSystem(app, opt),
	login: login(app, opt),
	classes: classes(app, opt),
	users: users(app, opt),
	courses: courses(app, opt),
	accounts: accounts(app, opt),
});
