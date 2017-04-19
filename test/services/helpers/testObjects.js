"use strict";

module.exports = function (app) {

	const accountService = app.service('accounts');
	const systemService = app.service('systems');
	const userService = app.service('users');

	let createdAccountIds = [];
	let createdUserIds = [];
	let createdSystemIds = [];

	function createTestSystem(url) {
		return systemService.create({url: url, type: 'moodle'})
			.then(system => {
				createdSystemIds.push(system.id);
				return system;
			});
	}

	function createTestAccount(accountParameters, system, user) {
		accountParameters.systemId = system.id;
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
		email = 'max@mustermann.de',
		schoolId = '584ad186816abba584714c94'
	}) {
		return userService.create({
			// required fields for user
			firstName,
			lastName,
			email,
			schoolId
		})
			.then(user => {
				createdUserIds.push(user.id);
				return user;
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
		return Promise.all(accountDeletions + userDeletions + systemDeletions);
	}

	return {
		createTestSystem: createTestSystem,
		createTestAccount: createTestAccount,
		createTestUser: createTestUser,
		cleanup: cleanup,
		createdUserIds: createdUserIds
	};
};
