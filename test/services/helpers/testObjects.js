const logger = require('winston');

const serviceHelpers = require('./services');

const warn = (message, pass) => {
	logger.warn(message);
	return pass;
};

module.exports = (app, opt = {
	schoolId: '0000d186816abba584714c5f',
}) => {
	const {
		teams,
		testSystem,
		login,
		classes,
		users,
		courses,
		accounts,
	} = serviceHelpers(app, opt);

	const cleanup = () => {
		const accountDeletions = accounts.cleanup(); // createdAccountIds.map(id => accountService.remove(id));
		const userDeletions = users.cleanup();
		const systemDeletions = testSystem.cleanup();
		const classDeletions = classes.cleanup();
		const courseDeletions = courses.cleanup(); // createdCourses.map(id => coursesService.remove(id));
		const teamsDeletion = teams.cleanup();

		return Promise.all([teamsDeletion]
			.concat(accountDeletions)
			.concat(userDeletions)
			.concat(systemDeletions)
			.concat(classDeletions)
			.concat(courseDeletions))
			.then((res) => {
				logger.info('[TestObjects] cleanup data.');
				return res;
			})
			.catch((err) => {
				logger.warn('[TestObjects] Can not cleanup.', err);
				return err;
			});
	};

	function findRoles(query = {}) {
		const roleService = app.service('roles');
		return roleService.find({ query });
	}

	const info = () => ({
		teams: teams.info,
		users: users.info,
		testSystem: testSystem.info,
		classes: classes.info,
		tempPins: users.tempPinIds,
		courses: courses.info,
		accounts: accounts.info,
	});

	const createTestTeamWithOwner = async () => {
		const user = await users.create();
		const team = await teams.create(user);
		return { team, user };
	};

	const setupUser = async () => {
		// create account
		const user = await users.create();
		// const account = createTestAccount();
		// fetch jwt
		const account = {};
		const requestParams = {};
		return { user, account, requestParams };
	};

	return {
		createTestSystem: testSystem.create,
		createTestAccount: warn('@implement should rewrite', accounts.create),
		createTestUser: users.create,
		createTestClass: classes.create,
		createTestCourse: courses.create,
		cleanup,
		generateJWT: login.generateJWT,
		generateRequestParams: login.generateRequestParams,
		fakeLoginParams: login.fakeLoginParams,
		createdUserIds: warn('@deprecated use info() instat', users.info),
		teams,
		createTestTeamWithOwner,
		info,
		setupUser: warn('@implement should finished', setupUser),
		options: opt,
		findRoles,
	};
};
