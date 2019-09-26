const logger = require('../../../src/logger/index');

const serviceHelpers = require('./services');

const warn = (message, pass) => {
	logger.warning(message);
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
		roles,
		schools,
		years,
	} = serviceHelpers(app, opt);

	const cleanup = () => Promise.all([]
		.concat(accounts.cleanup())
		.concat(users.cleanup())
		.concat(testSystem.cleanup())
		.concat(classes.cleanup())
		.concat(courses.cleanup())
		.concat(teams.cleanup())
		.concat(roles.cleanup())
		.concat(schools.cleanup())
		.concat(years.cleanup()))
		.then((res) => {
			logger.info('[TestObjects] cleanup data.');
			return res;
		})
		.catch((err) => {
			logger.warning('[TestObjects] Can not cleanup.', err);
			return err;
		});

	const info = () => ({
		teams: teams.info,
		users: users.info,
		testSystem: testSystem.info,
		classes: classes.info,
		tempPins: users.tempPinIds,
		courses: courses.info,
		accounts: accounts.info,
		schools: schools.info,
		years: years.info,
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
		createTestRole: roles.create,
		createTestSchool: schools.create,
		cleanup,
		generateJWT: login.generateJWT,
		generateRequestParams: login.generateRequestParams,
		fakeLoginParams: login.fakeLoginParams,
		createdUserIds: warn('@deprecated use info() instead', users.info),
		teams,
		createTestTeamWithOwner,
		info,
		setupUser: warn('@implement should finished', setupUser),
		options: opt,
	};
};
