const errors = require('feathers-errors');

const AbstractLoginStrategy = require('./interface.js');

class LdapLoginStrategy extends AbstractLoginStrategy {
	constructor(app) {
		super();
		this.app = app;
	}

	login({ username, password }, system) {
		const app = this.app;
		const ldapService = app.service('ldap');

		app.service('accounts').find({query: {username}})
			.then(([account]) => {
				return app.service('users').get(account.userId);
			})
			.then(user => {
				return Promise.all([
					Promise.resolve(user),
					app.service('schools').get(user.schoolId)
				]);
			})
			.then(([user, school]) => {
				return app.service('ldapConfigs').get(school.ldapConfig)
					.then(config => {
						return ldapService.authorize(config, school, user.ldapDn, password);
					});
			})
			.catch((err) => {
				return Promise.reject(err);
			});
	}
}

module.exports = LdapLoginStrategy;
