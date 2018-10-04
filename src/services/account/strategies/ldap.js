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
		const SCHOOL = 'N21Testschule'; // TODO: use user's school id (needs real data in DB/IDM)
		const USER = process.env.LDAPUSER ? process.env.LDAPUSER : username;
		password = process.env.LDAPPW ? process.env.LDAPPW : password;

		const client = ldap.createClient({
			url: 'ldaps://idm.niedersachsen.cloud:636' // TODO: port 7636 throws self-signed certificate error
		});

		const ldapRootPath = 'dc=idm,dc=nbc';
		const qualifiedUser = `uid=${USER},cn=users,${ldapRootPath}`;

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
				//filter: 'uid=' + username,
				filter: 'uid=' + 'hpi.kaiser',
				scope: 'sub',
				attributes: []
			};

			return new Promise((resolve, reject) => {
				client.search(`ou=${SCHOOL},${ldapRootPath}`, opts, function (err, res) {
					res.on('searchEntry', function (entry) {
						resolve(entry.object);
					});
					res.on('error', reject);
					res.on('end', function (result) {
						// TODO: handle status codes != 0
						console.log('LDAP status: ' + result.status);
					});
				});
			});

			
        }).then((idm_user) => {
			let userPromise = app.service('users').find({query: { ldapDn: idm_user.dn }});
			let accountPromise = app.service('accounts').find({query: {username: username, systemId: system._id}});
			
			return Promise.all([userPromise, accountPromise, Promise.resolve(idm_user)]);
		}).then(([users,accounts,idm_user]) => {
			let userPromise, accountPromise = Promise.resolve();

			if (users.total == 0) {
				let email = idm_user.email || "test.adress42@SC.de";
				//todo: avoid faking a pin verification process
				userPromise = app.service('registrationPins').create({"email": email, verified: true})
				.then(registrationPin => {
					let newUserData = {
						pin: registrationPin.pin,
						firstName: idm_user.givenName,
						lastName: idm_user.sn,
						schoolId: "0000d186816abba584714c5f",
						email: email,
						ldapDn: idm_user.dn
					};
					if (idm_user.objectClass.includes("ucsschoolTeacher")) {
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
