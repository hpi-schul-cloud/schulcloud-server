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
		consents,
		courses,
		courseGroups,
		accounts,
		roles,
		schools,
		years,
		schoolGroups,
		datasources,
		homeworks,
		submissions,
		lessons,
		storageProviders,
	} = serviceHelpers(app, opt);

	const cleanup = () => Promise.all([]
		.concat(accounts.cleanup())
		.concat(users.cleanup())
		.concat(consents.cleanup())
		.concat(testSystem.cleanup())
		.concat(classes.cleanup())
		.concat(courses.cleanup())
		.concat(courseGroups.cleanup())
		.concat(teams.cleanup())
		.concat(roles.cleanup())
		.concat(schools.cleanup())
		.concat(schoolGroups.cleanup())
		.concat(years.cleanup())
		.concat(datasources.cleanup())
		.concat(submissions.cleanup())
		.concat(lessons.cleanup())
		.concat(homeworks.cleanup())
		.concat(storageProviders.cleanup()))
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
		courseGroups: courseGroups.info,
		accounts: accounts.info,
		schools: schools.info,
		schoolGroups: schoolGroups.info,
		years: years.info,
		datasources: datasources.info,
		homeworks: homeworks.info,
		submissions: submissions.info,
		lessons: lessons.info,
		storageProviders: storageProviders.info,
	});

	const createTestTeamWithOwner = async (userData) => {
		const user = await users.create(userData);
		const team = await teams.create(user);
		return { team, user };
	};

	const setupUser = async (userData) => {
		try {
			const user = await users.create(userData);
			const requestParams = await login.generateRequestParamsFromUser(user);
			const { account } = requestParams;

			return {
				user,
				account,
				requestParams,
				userId: user._id.toString(),
				accountId: account._id.toString(),
			};
		} catch (err) {
			logger.warning(err);
			return err;
		}
	};

	return {
		createTestSystem: testSystem.create,
		createTestAccount: accounts.create,
		createTestUser: users.create,
		createTestConsent: consents.create,
		createTestClass: classes.create,
		createTestCourse: courses.create,
		createTestCourseGroup: courseGroups.create,
		createTestRole: roles.create,
		createTestSchool: schools.create,
		createTestSchoolGroup: schoolGroups.create,
		createTestDatasource: datasources.create,
		createTestHomework: homeworks.create,
		createTestSubmission: submissions.create,
		createTestLesson: lessons.create,
		createTestStorageProvider: storageProviders.create,
		cleanup,
		generateJWT: login.generateJWT,
		generateRequestParams: login.generateRequestParams,
		generateRequestParamsFromUser: login.generateRequestParamsFromUser,
		createdUserIds: warn('@deprecated use info() instead', users.info),
		teams,
		classes,
		createTestTeamWithOwner,
		info,
		setupUser,
		options: opt,
	};
};
