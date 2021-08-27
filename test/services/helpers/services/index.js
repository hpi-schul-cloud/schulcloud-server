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
const ltiTools = require('./ltiTools');
const problems = require('./problems');
const pseudonyms = require('./pseudonyms');
const roles = require('./roles');
const registrationPins = require('./registrationPins');
const schoolGroups = require('./schoolGroups');
const schools = require('./schools');
const storageProviders = require('./storageProviders');
const submissions = require('./submissions');
const teams = require('./teams');
const testSystem = require('./testSystem');
const users = require('./users');
const years = require('./years');
const trashbinData = require('./trashbinData');

module.exports = (app, opt) => ({
	accounts: accounts(app, opt),
	activation: activation(app, opt),
	classes: classes(app, opt),
	consents: consents(app, opt),
	consentVersion: consentVersion(app, opt),
	courses: courses(app, opt),
	courseGroups: courseGroups(app, opt),
	registrationPins: registrationPins(app, opt),
	roles,
	schools: schools(app, opt),
	years,
	schoolGroups,
	datasources: datasources(app, opt),
	files: files(app, opt),
	homeworks: homeworks(app, opt),
	lessons,
	login: login(app, opt),
	ltiTools: ltiTools(app, opt),
	problems,
	pseudonyms,
	storageProviders: storageProviders(app),
	submissions: submissions(app, opt),
	teams: teams(app, opt),
	testSystem: testSystem(app, opt),
	users: users(app, opt),
	trashbinData: trashbinData(app, opt),
});
