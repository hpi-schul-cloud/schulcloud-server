const accounts = require('./accounts');
const activation = require('./activation');
const classes = require('./classes');
const consents = require('./consents');
const consentVersion = require('./consentVersion');
const courseGroups = require('./courseGroups');
const courses = require('./courses');
const datasources = require('./datasources');
const files = require('./files');
const homeworks = require('./homeworks');
const lessons = require('./lessons');
const login = require('./login');
const roles = require('./roles');
const schoolGroups = require('./schoolGroups');
const schools = require('./schools');
const storageProviders = require('./storageProviders');
const submissions = require('./submissions');
const teams = require('./teams');
const testSystem = require('./testSystem');
const users = require('./users');
const years = require('./years');

module.exports = (app, opt) => ({
	accounts: accounts(app, opt),
	activation: activation(app, opt),
	classes: classes(app, opt),
	consents: consents(app, opt),
	consentVersion: consentVersion(app, opt),
	courses: courses(app, opt),
	courseGroups: courseGroups(app, opt),
	roles,
	schools: schools(app, opt),
	years,
	schoolGroups,
	datasources: datasources(app, opt),
	files: files(app, opt),
	homeworks: homeworks(app, opt),
	lessons,
	login: login(app, opt),
	storageProviders: storageProviders(app),
	submissions: submissions(app, opt),
	teams: teams(app, opt),
	testSystem: testSystem(app, opt),
	users: users(app, opt),
});
