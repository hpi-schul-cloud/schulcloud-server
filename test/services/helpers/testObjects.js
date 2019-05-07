module.exports = (app) => {
	const accountService = app.service('accounts');
	const systemService = app.service('systems');
	const userService = app.service('users');
	const classesService = app.service('classes');
	const coursesService = app.service('courses');
	const registrationPinsService = app.service('registrationPins');

	function initInstanceIds() {
		return {
			accounts: [],
			users: [],
			systems: [],
			classes: [],
			courses: [],
		};
	}

	let instanceIds = initInstanceIds();

	function createTestSystem({ url, type = 'moodle' }) {
		return systemService.create({ url, type })
			.then((system) => {
				instanceIds.systems.push(system.id);
				return system;
			});
	}

	function createTestAccount(accountParameters, system, user) {
		if (system) accountParameters.systemId = system.id;
		accountParameters.userId = user._id;
		return accountService.create(accountParameters)
			.then((account) => {
				instanceIds.accounts.push(account._id);
				return Promise.resolve(account);
			});
	}

	function createTestUser({
		// required fields for user
		firstName = 'Max',
		lastName = 'Mustermann',
		email = `max${Date.now()}@mustermann.de`,
		schoolId = '584ad186816abba584714c94',
		accounts = [],
		roles = [],
		discoverable = false,
		// manual cleanup, e.g. when testing delete:
		manualCleanup = false,
	} = {}) {
		return registrationPinsService.create({ email })
			.then(registrationPin => registrationPinsService.find({
				query: { pin: registrationPin.pin, email: registrationPin.email, verified: false },
			})).then(() => userService.create({
				firstName,
				lastName,
				email,
				schoolId,
				accounts,
				roles,
				discoverable,
			}))

			.then((user) => {
				if (!manualCleanup) {
					instanceIds.users.push(user.id);
				}
				return user;
			});
	}

	function createTestClass({
		// required fields
		name = 'testClass',
		schoolId = '584ad186816abba584714c94',
		userIds = [],
		teacherIds = [],
	}) {
		return classesService.create({
			// required fields for user
			name,
			schoolId,
			userIds,
			teacherIds,
		})
			.then((o) => {
				instanceIds.classes.push(o.id);
				return o;
			});
	}

	function createTestCourse({
		// required fields for base group
		name = 'testCourse',
		schoolId = '584ad186816abba584714c94',
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
		})
			.then((o) => {
				instanceIds.courses.push(o.id);
				return o;
			});
	}

	function cleanup() {
		const deletions = Object.keys(instanceIds).map((serviceName) => {
			const service = app.service(serviceName);
			return instanceIds[serviceName].map(id => service.remove(id));
		});
		// flatten all Promises into one array:
		const flatDeletions = deletions.reduce((acc, x) => acc.concat(x), []);
		instanceIds = initInstanceIds();
		return Promise.all(flatDeletions);
	}

	return {
		createTestSystem,
		createTestAccount,
		createTestUser,
		createTestClass,
		createTestCourse,
		cleanup,
		createdUserIds: instanceIds.users,
	};
};
