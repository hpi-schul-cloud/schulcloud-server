const {
	requestFullSchoolSync, requestSyncForEachCourseUser, requestSyncForEachTeamUser, requestFullSyncForUser,
} = require('./producer');

const setup = async (app) => {
	// teams
	app.service('teams').on('created', requestSyncForEachTeamUser);
	app.service('teams').on('patched', requestSyncForEachTeamUser);
	app.service('teams').on('updated', requestSyncForEachTeamUser);

	// courses
	app.service('courses').on('created', requestSyncForEachCourseUser);
	app.service('courses').on('patched', requestSyncForEachCourseUser);
	app.service('courses').on('updated', requestSyncForEachCourseUser);

	// users
	app.service('users').on('created', requestFullSyncForUser);
	// app.service('users').on('removed', handleUserRemoved);

	// schools
	app.service('schools').on('created', requestFullSchoolSync);
	app.service('schools').on('patched', requestFullSchoolSync);
	app.service('schools').on('updated', requestFullSchoolSync);
};

module.exports = setup;
