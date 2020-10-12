const {
	requestFullSchoolSync,
	requestSyncForEachCourseUser,
	requestSyncForEachTeamUser,
	requestFullSyncForUser,
} = require('./producer');

const setup = async (app) => {
	// teams
	app.service('teams').on('created', (team, _context) => requestSyncForEachTeamUser(team));
	app.service('teams').on('patched', (team, _context) => requestSyncForEachTeamUser(team));
	app.service('teams').on('updated', (team, _context) => requestSyncForEachTeamUser(team));

	// courses
	app.service('courses').on('created', (course, _context) => requestSyncForEachCourseUser(course));
	app.service('courses').on('patched', (course, _context) => requestSyncForEachCourseUser(course));
	app.service('courses').on('updated', (course, _context) => requestSyncForEachCourseUser(course));

	// users
	app.service('users').on('created', (user, _context) => requestFullSyncForUser(user));
	// app.service('users').on('removed', handleUserRemoved);

	// schools
	app.service('schools').on('created', (school, _context) => requestFullSchoolSync(school));
	app.service('schools').on('patched', (school, _context) => requestFullSchoolSync(school));
	app.service('schools').on('updated', (school, _context) => requestFullSchoolSync(school));
};

module.exports = setup;
