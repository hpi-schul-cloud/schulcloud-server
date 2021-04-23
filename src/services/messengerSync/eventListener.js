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
	app.service('teams').on('created', async (team, _context) => requestTeamSync(team));
	app.service('teams').on('patched', async (team, _context) => requestTeamSync(team));
	app.service('teams').on('updated', async (team, _context) => requestTeamSync(team));
	app.service('teams').on('removed', async (team, _context) => requestTeamRemoval(team));

	// courses
	app.service('courses').on('created', async (course, _context) => requestCourseSync(course));
	app.service('courses').on('patched', async (course, _context) => requestCourseSync(course));
	app.service('courses').on('updated', async (course, _context) => requestCourseSync(course));
	app.service('courses').on('removed', async (course, _context) => requestCourseRemoval(course));

	// users
	app.service('users').on('created', async (user, _context) => requestFullSyncForUser(user));
	app.service('users').on('patched', async (user, _context) => requestFullSyncForUser(user));
	app.service('users').on('updated', async (user, _context) => requestFullSyncForUser(user));
	app.service('users').on('removed', async (user, _context) => requestUserRemoval(user));

	// schools
	app.service('schools').on('created', async (school, _context) => requestFullSchoolSync(school));
	app.service('schools').on('patched', async (school, _context) => requestFullSchoolSync(school));
	app.service('schools').on('updated', async (school, _context) => requestFullSchoolSync(school));
};

module.exports = setup;
