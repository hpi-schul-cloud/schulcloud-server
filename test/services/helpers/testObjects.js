const logger = require('winston');

const serviceHelpers = require('./services');

module.exports = (app, opt = {
	schoolId: '0000d186816abba584714c5f', // '584ad186816abba584714c94',
}) => {
	const { teams, testSystem, login } = serviceHelpers(app, opt);

	const accountService = app.service('accounts');
	const userService = app.service('users');
	const classesService = app.service('classes');
	const coursesService = app.service('courses');
	const registrationPinsService = app.service('registrationPins');

	const createdAccountIds = [];
	const createdUserIds = [];
	const createdClasses = [];
	const createdCourses = [];

	// should rewrite
	function createTestAccount(accountParameters, system, user) {
		if (system) accountParameters.systemId = system.id;
		accountParameters.userId = user._id;
		return accountService.create(accountParameters)
			.then((account) => {
				createdAccountIds.push(account._id.toString());
				return account;
			});
	}

	function createTestUser({
		// required fields for user
		firstName = 'Max',
		lastName = 'Mustermann',
		email = `max${Date.now()}@mustermann.de`,
		schoolId = opt.schoolId,
		accounts = [], // test if it has a effect
		roles = [],
		// manual cleanup, e.g. when testing delete:
		manualCleanup = false,
	} = {}) {
		return registrationPinsService.create({ email })
			.then(registrationPin => registrationPinsService.find({
				query: { pin: registrationPin.pin, email: registrationPin.email, verified: false },
			}))
			.then(() => userService.create({
				firstName,
				lastName,
				email,
				schoolId,
				accounts,
				roles,
			})).then((user) => {
				if (!manualCleanup) {
					createdUserIds.push(user._id.toString());
				}
				return user;
			});
	}

	function createTestClass({
		// required fields
		name = 'testClass',
		schoolId = opt.schoolId,
		userIds = [],
		teacherIds = [],
		nameFormat = 'static',
		gradeLevel = undefined,
	}) {
		return classesService.create({
			// required fields for user
			name,
			schoolId,
			userIds,
			teacherIds,
			nameFormat,
			gradeLevel,
		}).then((res) => {
			createdClasses.push(res._id.toString());
			return res;
		});
	}

	function createTestCourse({
		// required fields for base group
		name = 'testCourse',
		schoolId = opt.schoolId,
		userIds = [],
		classIds = [],
		teacherIds = [],
		ltiToolIds = [],
	}) {
		return coursesService.create({
			// required fields for user
			name,
			schoolId,
			userIds,
			classIds,
			teacherIds,
			ltiToolIds,
		}).then((course) => {
			createdCourses.push(course._id.toString());
			return course;
		});
	}

	const cleanup = () => {
		const accountDeletions = createdAccountIds.map(id => accountService.remove(id));
		const userDeletions = createdUserIds.map(id => userService.remove(id));
		const systemDeletions = testSystem.cleanup();
		const classDeletions = createdClasses.map(id => classesService.remove(id));
		const courseDeletions = createdCourses.map(id => coursesService.remove(id));
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

	const info = () => ({
		teams: teams.info,
		users: createdUserIds,
		testSystem: testSystem.info,
	});

	const createTestTeamWithOwner = async () => {
		const user = await createTestUser();
		const team = await teams.create(user);
		return { team, user };
	};

	const setupUser = async () => {
		// create account
		const user = await createTestUser();
		// const account = createTestAccount();
		// fetch jwt
		const account = {};
		const requestParams = {};
		return { user, account, requestParams };
	};

	return {
		createTestSystem: testSystem.create,
		createTestAccount,
		createTestUser,
		createTestClass,
		createTestCourse,
		cleanup,
		generateJWT: login.generateJWT,
		generateRequestParams: login.generateRequestParams,
		createdUserIds, // @deprecated use info
		teams,
		createTestTeamWithOwner,
		info,
		setupUser,
	};
};
