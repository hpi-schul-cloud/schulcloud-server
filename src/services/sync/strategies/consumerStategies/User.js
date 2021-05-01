const BaseConsumerStrategie = require('./BaseConsumerStrategie');
// TODO: place from where it is importat must be fixed later
const { LDAP_SYNC_ACTIONS } = require('../LDAPSyncer');
const { SchoolRepo, UserRepo } = require('../../repo');

const defaultOptions = {
	allowedLogKeys: ['ldapId', 'systemId', 'roles', 'activated'],
	SchoolRepo,
	UserRepo,
};

class User extends BaseConsumerStrategie {
	constructor(filterActive = true, options = defaultOptions) {
		super(LDAP_SYNC_ACTIONS.SYNC_SCHOOL, options);
		this.filterActive = filterActive;
	}

	async action(data = {}) {
		const { user = {}, account = {} } = data;
		const school = await this.SchoolRepo.findSchoolByLdapIdAndSystem(user.schoolDn, user.systemId);
		if (school) {
			const foundUser = await this.UserRepo.findByLdapIdAndSchool(user.ldapId, school._id);
			if (foundUser !== null) {
				await this.updateUserAndAccount(foundUser, user, account);
			} else {
				await this.createUserAndAccount(user, account, school._id);
			}
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
		// Updating SchoolId will cause an issue. We need to discuss about it
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
			return this.UserRepo.updateUserAndAccount(foundUser._id, updateObject, account);
		}
		return true;
	}

	async createUserAndAccount(idmUser, account, schoolId) {
		idmUser.schoolId = schoolId;
		return this.UserRepo.createUserAndAccount(idmUser, account);
	}
}

// TODO: should rename in more specific way
module.exports = User;
