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
			}).then((idmUser) => {
				let userPromise = app.service('users').find({query: { ldapDn: idmUser.dn }});
				let accountPromise = app.service('accounts').find({query: {username: username, systemId: system._id}});

				return Promise.all([userPromise, accountPromise, Promise.resolve(idmUser)]);
			}).then(([users, accounts, idmUser]) => {
				let userPromise, accountPromise = Promise.resolve();

				if (users.total == 0) {
					let email = idmUser.email || "test.adress42@SC.de";
					//todo: avoid faking a pin verification process
					userPromise = app.service('registrationPins').create({"email": email, verified: true})
					.then(registrationPin => {
						let newUserData = {
							pin: registrationPin.pin,
							firstName: idmUser.givenName,
							lastName: idmUser.sn,
							schoolId: "0000d186816abba584714c5f",
							email: email,
							ldapDn: idmUser.dn
						};
						if (idmUser.objectClass.includes("ucsschoolTeacher")) {
							newUserData.role = "teacher";
						}

						return userPromise = app.service('users').create(newUserData);
					});
				} else userPromise = Promise.resolve(users[0]);

				/* //ToDo create account - avoid saving password - currently causing endless loop
				if (accounts.length == 0) {
					let newAccountData = {
						username: username,
						password: password,
						systemId: system._id
					};
					accountPromise = app.service('accounts').create(newAccountData);
				}*/
				if (accounts.length != 0) accountPromise = Promise.resolve(accounts[0]);

				return Promise.all([userPromise, accountPromise]);
			}).then(([user, account]) => {

				if (account && !account.userId == user._id) {
					return app.service('accounts').patch(account._id, {userId: user._id});
				}
				return Promise.resolve;
			}).catch((err) => {
				return Promise.reject(err);
			});
	}
}

module.exports = LdapLoginStrategy;
