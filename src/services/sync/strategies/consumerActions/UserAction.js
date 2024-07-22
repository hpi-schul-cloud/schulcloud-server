const _ = require('lodash');

const { Configuration } = require('@hpi-schul-cloud/commons');
const BaseConsumerAction = require('./BaseConsumerAction');
// TODO: place from where it is importat must be fixed later
const { LDAP_SYNC_ACTIONS } = require('../SyncMessageBuilder');
const { SchoolRepo, UserRepo } = require('../../repo');
const { NotFound } = require('../../../../errors');
const { isNotEmptyString } = require('../../../../helper/stringHelper');
const { SCHOOL_FEATURES } = require('../../../school/model');

const defaultOptions = {
	allowedLogKeys: ['ldapId', 'systemId', 'roles', 'activated', 'schoolDn'],
};

class UserAction extends BaseConsumerAction {
	constructor(app, filterActive = true, options = defaultOptions) {
		super(LDAP_SYNC_ACTIONS.SYNC_USER, options);
		this.app = app;
		this.filterActive = filterActive;
	}

	async action(data = {}) {
		const { user = {}, account = {} } = data;

		let school = await SchoolRepo.findSchoolByLdapIdAndSystem(user.schoolDn, user.systemId);

		if (!school) {
			const migratedSchool = await SchoolRepo.findSchoolByPreviousExternalIdAndSystem(user.schoolDn, user.systemId);

			if (!migratedSchool) {
				throw new NotFound(`School for schoolDn ${user.schoolDn} and systemId ${user.systemId} couldn't be found.`, {
					schoolDn: user.schoolDn,
					systemId: user.systemId,
				});
			}

			if (
				migratedSchool.userLoginMigration &&
				!migratedSchool.userLoginMigration.closedAt &&
				migratedSchool.features?.includes(SCHOOL_FEATURES.ENABLE_LDAP_SYNC_DURING_MIGRATION)
			) {
				school = migratedSchool;
			} else {
				throw new NotFound(
					`Migrated School with previous schoolDn ${user.schoolDn} and systemId ${user.systemId} has been found. 
				The Ldap-Sync for this school has been skipped, because the conditions for an extended Sync for migrated schools have not been met.`,
					{
						schoolDn: user.schoolDn,
						systemId: user.systemId,
					}
				);
			}
		}

		const foundUser = await UserRepo.findByLdapIdAndSchool(user.ldapId, school._id);

		if (!foundUser) {
			const oauthMigratedUser = await UserRepo.findByPreviousExternalIdAndSchool(user.ldapId, school._id);
			if (oauthMigratedUser) {
				// skip creating or updating users when user or school has migrated
				return;
			}
		}

		// create migration user when the ldapId is not existing on a real user
		if (school.inUserMigration === true && !foundUser && !school.userLoginMigration) {
			await this.createImportUser(user, school);
			return;
		}

		if (school.inMaintenance) {
			// skip updating users when school in maintenance mode (summer holidays)
			return;
		}

		// default: update or create user
		if (foundUser !== null) {
			await this.updateUserAndAccount(foundUser, user, account);
		} else {
			await this.createUserAndAccount(user, account, school);
		}
	}

	async autoMatchImportUser(schoolId, userUpdateObject) {
		if (!isNotEmptyString(userUpdateObject.firstName, true) || !isNotEmptyString(userUpdateObject.lastName, true)) {
			return;
		}
		const matchingLocalUsers = await UserRepo.findUserBySchoolAndName(
			schoolId,
			userUpdateObject.firstName,
			userUpdateObject.lastName
		);
		if (!matchingLocalUsers || matchingLocalUsers.length !== 1) {
			return;
		}
		const userMatch = matchingLocalUsers[0];
		const foundImportUsers = await UserRepo.findImportUsersBySchoolAndName(
			schoolId,
			userUpdateObject.firstName,
			userUpdateObject.lastName
		);
		if (foundImportUsers.length === 0) {
			userUpdateObject.match_userId = userMatch._id;
			userUpdateObject.match_matchedBy = 'auto';
		} else {
			// revoke other previously auto-matched import users
			await Promise.all(
				foundImportUsers.map((foundImportUser) => {
					if (foundImportUser.match_userId && foundImportUser.match_matchedBy === 'auto') {
						delete foundImportUser.match_userId;
						delete foundImportUser.match_matchedBy;
						return UserRepo.createOrUpdateImportUser(
							schoolId,
							foundImportUser.systemId,
							foundImportUser.ldapId,
							foundImportUser
						);
					}
					return Promise.resolve();
				})
			);
		}
	}

	async createImportUser(user, school) {
		const userUpdateObject = this.createUserUpdateObject(user, {});
		await this.autoMatchImportUser(school._id, userUpdateObject);
		await UserRepo.createOrUpdateImportUser(school._id, user.systemId, user.ldapId, userUpdateObject);
	}

	async updateUserAndAccount(foundUser, user, account) {
		// Prepare user update object with all the modified user data.
		const userUpdateObject = this.createUserUpdateObject(user, foundUser);

		// If the feature flag is enabled, set the last sync date value to the
		// current date - this will be, e.g., date of the last performed LDAP
		// server sync (for a specific user).
		if (Configuration.get('FEATURE_SYNC_LAST_SYNCED_AT_ENABLED') === true) {
			userUpdateObject.lastSyncedAt = new Date();
		}

		// Perform the user and account updates if the update object is not empty.
		if (!_.isEmpty(userUpdateObject)) {
			await this.app.service('/sync/userAccount').updateUserAndAccount(foundUser._id, userUpdateObject, account);
		}
	}

	createUserUpdateObject(user, foundUser) {
		const updateObject = {};

		if (user.firstName !== foundUser.firstName) {
			updateObject.firstName = user.firstName || ' ';
		}
		if (user.lastName !== foundUser.lastName) {
			updateObject.lastName = user.lastName;
		}
		if (user.email !== foundUser.email) {
			updateObject.email = user.email;
		}
		if (user.ldapDn !== foundUser.ldapDn) {
			updateObject.ldapDn = user.ldapDn;
		}

		// Role
		const userRoles = foundUser.roles && foundUser.roles.map((r) => r.name);
		if (!_.isEqual(userRoles, user.roles)) {
			updateObject.roles = user.roles;
		}

		return updateObject;
	}

	async createUserAndAccount(idmUser, account, school) {
		idmUser.schoolId = school._id;

		// If the feature flag is enabled, set the last sync date value to the
		// current date as new users and accounts are also created in the sync
		// process, and they should be considered synchronized at the time of
		// creation.
		if (Configuration.get('FEATURE_SYNC_LAST_SYNCED_AT_ENABLED') === true) {
			idmUser.lastSyncedAt = new Date();
		}

		const userAccountService = await this.app.service('/sync/userAccount');
		return userAccountService.createUserAndAccount(idmUser, account, school);
	}
}

module.exports = UserAction;
