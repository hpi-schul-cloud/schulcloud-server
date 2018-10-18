const errors = require('feathers-errors');

const AbstractLoginStrategy = require('./interface.js');

class LdapLoginStrategy extends AbstractLoginStrategy {
	constructor(app) {
		super();
		this.app = app;
	}

	login({ username, password }, system, schoolId) {
		const app = this.app;
		const ldapService = app.service('ldap');

		return app.service('schools').get(schoolId)
			.then(school => {
				return app.service('accounts').find({ query: {username: username }})
				.then(([account]) => {
					return app.service('users').get(account.userId);
				})
				.then(user => {
					return ldapService.authenticate(system, user.ldapDn, password);
				});
			});
	}
}

module.exports = LdapLoginStrategy;
