class UserRepo {
	constructor(app) {
		this.app = app;
		this.service = this.app.service('users');
	}

	create(idmUser, account, schoolId) {
		return this.service.create({
			firstName: idmUser.firstName,
			lastName: idmUser.lastName,
			schoolId,
			email: idmUser.email,
			ldapDn: idmUser.ldapDn,
			ldapId: idmUser.ldapId,
			roles: idmUser.roles,
		});
	}

	findByLdapIdAndSchool(ldapId, schoolId) {
		return this.service.find({
			query: {
				ldapId,
				schoolId,
				$populate: ['roles'],
			},
		});
	}

	patch(id, updateObject) {
		return this.service.patch(id, updateObject);
	}
}

module.exports = UserRepo;
