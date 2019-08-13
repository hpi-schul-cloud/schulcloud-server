const teams = require('./teams');
const testSystem = require('./testSystem');
const login = require('./login');
const classes = require('./classes');
const users = require('./users');
const courses = require('./courses');
const accounts = require('./accounts');
const roles = require('./roles');
const schools = require('./schools');
const years = require('./years');

module.exports = (app, opt) => ({
	teams: teams(app, opt),
	testSystem: testSystem(app, opt),
	login: login(app, opt),
	classes: classes(app, opt),
	users: users(app, opt),
	courses: courses(app, opt),
	accounts: accounts(app, opt),
	roles,
	schools: schools(app, opt),
	years,
});
