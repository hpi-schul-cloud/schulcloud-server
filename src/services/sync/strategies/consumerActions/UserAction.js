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
		if (school) {
			const foundUser = await UserRepo.findByLdapIdAndSchool(user.ldapId, school._id);
			if (foundUser !== null) {
				await this.updateUserAndAccount(foundUser, user, account);
			} else {
				await this.createUserAndAccount(user, account, school._id);
			}
		} else {
			throw new NotFound(`School for schoolDn ${user.schoolDn} and systemId ${user.systemId} couldn't be found.`, {
				schoolDn: user.schoolDn,
				systemId: user.systemId,
			});
		}
	}

	async updateUserAndAccount(foundUser, user, account) {
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
		if (!_.isEmpty(updateObject)) {
			return UserRepo.updateUserAndAccount(foundUser._id, updateObject, account);
		}
		return true;
	}

	async createUserAndAccount(idmUser, account, schoolId) {
		idmUser.schoolId = schoolId;
		return UserRepo.createUserAndAccount(idmUser, account);
	}
}

module.exports = UserAction;
