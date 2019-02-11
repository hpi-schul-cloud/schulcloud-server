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
		const lowerUsername = username.toLowerCase();

		return app.service('schools').get(schoolId)
			.then(school => {
				return app.service('accounts').find({ query: {username: lowerUsername }})
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
