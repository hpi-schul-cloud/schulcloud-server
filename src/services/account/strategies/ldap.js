const logger = require('winston');
const promisify = require('es6-promisify');
const errors = require('feathers-errors');
const request = require('request-promise-native');
const ldap = require('ldapjs');

const AbstractLoginStrategy = require('./interface.js');

class LdapLoginStrategy extends AbstractLoginStrategy {
	constructor(app) {
		super();
		this.app = app;
	}

	login({ username, password }, system) {
		const app = this.app;
		const TEST_SCHOOL = '0000d186816abba584714c5f'; // TODO: use user's school id (needs real data in DB/IDM)
		const USER = process.env.LDAPUSER ? process.env.LDAPUSER : username;
		password = process.env.LDAPPW ? process.env.LDAPPW : password;

		app.service('schools').get(TEST_SCHOOL)
			.then(school => {
				return app.service('ldapConfigs').get(school.ldapConfig)
					.then(config => {
						return Promise.resolve(Object.assign(config, {ou: school.ldapSchoolIdentifier}))
					});
			})
			.then(config => {
				const client = ldap.createClient({
					url: config.url
				});

				const qualifiedUser = `uid=${USER},cn=users,${config.rootPath}`;

				return new Promise((resolve, reject) => {
					client.bind(qualifiedUser, password, function(err) {
						if (err) {
							reject(new errors.NotAuthenticated('Wrong credentials'));
						} else {
							resolve(client);
						}
					});
				}).then((client) => {
					const opts = {
						filter: 'uid=' + username,
						scope: 'sub',
						attributes: []
					};

					return new Promise((resolve, reject) => {
						client.search(`ou=${config.ou},${config.rootPath}`, opts, function (err, res) {
							res.on('searchEntry', function (entry) {
								resolve(entry.object);
							});
							res.on('error', reject);
							res.on('end', reject);
						});
					});


				}).then((idmUser) => {
					let userPromise = app.service('users').find({query: { ldapDn: idmUser.dn }});
					let accountPromise = app.service('accounts').find({query: {username: username, systemId: system._id}});

					return Promise.all([userPromise, accountPromise, Promise.resolve(idmUser)]);
				}).then(([users,accounts,idmUser]) => {
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
			});

	}
}

module.exports = LdapLoginStrategy;
