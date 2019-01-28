"use strict";

module.exports = function (app) {

	const accountService = app.service('accounts');
	const systemService = app.service('systems');
	const userService = app.service('users');
	const classesService = app.service('classes');
	const coursesService = app.service('courses');
	const registrationPinsService = app.service('registrationPins');

	let createdAccountIds = [];
	let createdUserIds = [];
	let createdSystemIds = [];
	let createdClasses = [];
	let createdCourses = [];

	function createTestSystem({url, type='moodle'}) {
		return systemService.create({url, type})
			.then(system => {
				createdSystemIds.push(system.id);
				return system;
			});
	}

	function createTestAccount(accountParameters, system, user) {
		if (system) accountParameters.systemId = system.id;
		accountParameters.userId = user._id;
		return accountService.create(accountParameters)
			.then(account => {
				createdAccountIds.push(account._id);
				return Promise.resolve(account);
			});
	}

	function createTestUser({
		// required fields for user
		firstName = 'Max',
		lastName = 'Mustermann',
		email = 'max' + Date.now() + '@mustermann.de',
		schoolId = '584ad186816abba584714c94',
		accounts = [],
		roles = [],
	} = {}) {
		return registrationPinsService.create({"email": email})
				.then(registrationPin => {
					return registrationPinsService.find({
						query: { "pin": registrationPin.pin, "email": registrationPin.email, verified: false }
					});
				}).then(_ => {
					return userService.create({
						firstName,
						lastName,
						email,
						schoolId,
						accounts,
						roles,
					});
				})

			.then(user => {
				createdUserIds.push(user.id);
				return user;
			});
	}

	function createTestClass({
		// required fields
		name = 'testClass',
		schoolId = '584ad186816abba584714c94',
		userIds = [],
		teacherIds = []
	}) {
		return classesService.create({
			// required fields for user
			name,
			schoolId,
			userIds,
			teacherIds
		})
			.then(o => {
				createdClasses.push(o.id);
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
		ltiToolIds = []
	}) {
		return coursesService.create({
			// required fields for user
			name,
			schoolId,
			userIds,
			classIds,
			teacherIds,
			ltiToolIds
		})
			.then(o => {
				createdCourses.push(o.id);
				return o;
			});
	}

	function cleanup() {
		const accountDeletions = createdAccountIds.map(id => {
			return accountService.remove(id);
		});
		const userDeletions = createdUserIds.map(id => {
			return userService.remove(id);
		});
		const systemDeletions = createdSystemIds.map(id => {
			return systemService.remove(id);
		});
		const classDeletions = createdClasses.map(id => {
			return classesService.remove(id);
		});
		const courseDeletions = createdCourses.map(id => {
			return coursesService.remove(id);
		});
		return Promise.all(accountDeletions + userDeletions + systemDeletions + classDeletions + courseDeletions);
	}

	return {
		createTestSystem,
		createTestAccount,
		createTestUser,
		createTestClass,
		createTestCourse,
		cleanup,
		createdUserIds
	};
};
