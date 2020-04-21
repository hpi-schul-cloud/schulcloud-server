const logger = require('../../../src/logger/index');

const serviceHelpers = require('./services');

const warn = (message, pass) => {
	logger.warning(message);
	return pass;
};

module.exports = (app, opt = { schoolId: '0000d186816abba584714c5f' }) => {
	const {
		accounts,
		classes,
		consents,
		courses,
		datasources,
		files,
		homeworks,
		lessons,
		login,
		roles,
		schoolGroups,
		schools,
		storageProviders,
		submissions,
		teams,
		testSystem,
		users,
		years,
	} = serviceHelpers(app, opt);

	const cleanup = () => Promise.all([
		accounts,
		users,
		consents,
		testSystem,
		classes,
		courses,
		teams,
		roles,
		schools,
		schoolGroups,
		years,
		datasources,
		submissions,
		lessons,
		homeworks,
		storageProviders,
		files,
	].reverse().map((factory) => factory.cleanup()))
		.then((res) => {
			logger.info('[TestObjects] cleanup data.');
			return res;
		})
		.catch((err) => {
			logger.warning('[TestObjects] Can not cleanup.', err);
			return err;
		});

	const info = () => ({
		accounts: accounts.info,
		classes: classes.info,
		courses: courses.info,
		datasources: datasources.info,
		files: files.info,
		homeworks: homeworks.info,
		lessons: lessons.info,
		schoolGroups: schoolGroups.info,
		schools: schools.info,
		storageProviders: storageProviders.info,
		submissions: submissions.info,
		teams: teams.info,
		tempPins: users.tempPinIds,
		testSystem: testSystem.info,
		users: users.info,
		years: years.info,
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
		createTestAccount: accounts.create,
		createTestClass: classes.create,
		createTestConsent: consents.create,
		createTestCourse: courses.create,
		createTestDatasource: datasources.create,
		createTestFile: files.create,
		createTestHomework: homeworks.create,
		createTestLesson: lessons.create,
		createTestRole: roles.create,
		createTestSchool: schools.create,
		createTestSchoolGroup: schoolGroups.create,
		createTestStorageProvider: storageProviders.create,
		createTestSubmission: submissions.create,
		createTestSystem: testSystem.create,
		createTestUser: users.create,
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
