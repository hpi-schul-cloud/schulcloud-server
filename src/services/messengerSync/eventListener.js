const {
	requestFullSchoolSync,
	requestCourseSync,
	requestTeamSync,
	requestFullSyncForUser,
	requestTeamRemoval,
	requestCourseRemoval,
	requestUserRemoval,
} = require('./producer');

const setup = async (app) => {
	// teams
	app.service('teams').on('created', (team, _context) => requestTeamSync(team));
	app.service('teams').on('patched', (team, _context) => requestTeamSync(team));
	app.service('teams').on('updated', (team, _context) => requestTeamSync(team));
	app.service('teams').on('removed', (team, _context) => requestTeamRemoval(team));

	// courses
	app.service('courses').on('created', (course, _context) => requestCourseSync(course));
	app.service('courses').on('patched', (course, _context) => requestCourseSync(course));
	app.service('courses').on('updated', (course, _context) => requestCourseSync(course));
	app.service('courses').on('removed', (course, _context) => requestCourseRemoval(course));

	// users
	app.service('users').on('created', (user, _context) => requestFullSyncForUser(user));
	app.service('users').on('patched', (user, _context) => requestFullSyncForUser(user));
	app.service('users').on('updated', (user, _context) => requestFullSyncForUser(user));
	app.service('users').on('removed', (user, _context) => requestUserRemoval(user));

	// schools
	app.service('schools').on('created', (school, _context) => requestFullSchoolSync(school));
	app.service('schools').on('patched', (school, _context) => requestFullSchoolSync(school));
	app.service('schools').on('updated', (school, _context) => requestFullSchoolSync(school));
};

module.exports = setup;
