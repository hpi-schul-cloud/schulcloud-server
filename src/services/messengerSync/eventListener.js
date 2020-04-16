const {
	requestFullSchoolSync, requestSyncForEachCourseUser, requestSyncForEachTeamUser, requestFullSyncForUser,
} = require('./producer');

const handleSchoolChanged = async (school) => {
	if (school.features && school.features.includes('messenger')) {
		requestFullSchoolSync(school);
	}
};

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
	app.service('schools').on('created', handleSchoolChanged);
	app.service('schools').on('patched', handleSchoolChanged);
	app.service('schools').on('updated', handleSchoolChanged);
};

module.exports = setup;
