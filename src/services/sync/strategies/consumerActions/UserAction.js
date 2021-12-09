const _ = require('lodash');

const BaseConsumerAction = require('./BaseConsumerAction');
// TODO: place from where it is importat must be fixed later
const { LDAP_SYNC_ACTIONS } = require('../SyncMessageBuilder');
const { SchoolRepo, UserRepo } = require('../../repo');
const { NotFound } = require('../../../../errors');

const defaultOptions = {
	allowedLogKeys: ['ldapId', 'systemId', 'roles', 'activated', 'schoolDn'],
};

class UserAction extends BaseConsumerAction {
	constructor(filterActive = true, options = defaultOptions) {
		super(LDAP_SYNC_ACTIONS.SYNC_USER, options);
		this.filterActive = filterActive;
	}

	async action(data = {}) {
		const { user = {}, account = {} } = data;

		const school = await SchoolRepo.findSchoolByLdapIdAndSystem(user.schoolDn, user.systemId);

		if (!school) {
			throw new NotFound(`School for schoolDn ${user.schoolDn} and systemId ${user.systemId} couldn't be found.`, {
				schoolDn: user.schoolDn,
				systemId: user.systemId,
			});
		}

		const foundUser = await UserRepo.findByLdapIdAndSchool(user.ldapId, school._id);

		if (school.inUserMigration === true && !foundUser) {
			// create migration user when the ldapId is not existing
			const userUpdateObject = this.createUserUpdateObject(user, {});
			await UserRepo.createOrUpdateImportUser(school._id, user.systemId, user.ldapId, userUpdateObject);
			// TODO how to handle import users that have been removed in ldap later?
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
			await this.createUserAndAccount(user, account, school._id);
		}
	}

	async updateUserAndAccount(foundUser, user, account) {
		const updateObject = this.createUserUpdateObject(user, foundUser);
		if (!_.isEmpty(updateObject)) {
			await UserRepo.updateUserAndAccount(foundUser._id, updateObject, account);
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

	async createUserAndAccount(idmUser, account, schoolId) {
		idmUser.schoolId = schoolId;
		return UserRepo.createUserAndAccount(idmUser, account);
	}
}

module.exports = UserAction;
