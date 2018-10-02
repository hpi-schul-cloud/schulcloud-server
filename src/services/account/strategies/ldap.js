const logger = require('winston');
const promisify = require('es6-promisify');
const errors = require('feathers-errors');
const request = require('request-promise-native');
const ldap = require('ldapjs');

const AbstractLoginStrategy = require('./interface.js');

const acceptedCredentials = [
	{ username: 'a', password: 'a' },	// administrator
	{ username: 'lehrer@schul-cloud.org', password: 'schulcloud' },	// teacher
	{ username: 'schueler@schul-cloud.org', password: 'schulcloud' }	// student
];

class LdapLoginStrategy extends AbstractLoginStrategy {


	login({ username, password }, system) {

		const client = ldap.createClient({
			url: 'ldaps://idm.niedersachsen.cloud:636'
		});

		client.bind(process.env.LDAPUSER, process.env.LDAPPW, function (err) {
			//if (err) return Promise.reject(err);
			var opts = {
				filter: 'uid=michael.sternberg',
				scope: 'sub',
				attributes: []
			};

			client.search('ou=N21Testschule,dc=idm,dc=nbc', opts, function (err, res) {

				res.on('searchEntry', function (entry) {
					console.log('entry: ' + JSON.stringify(entry.object));
				});
				res.on('searchReference', function (referral) {
					console.log('referral: ' + referral.uris.join());
				});
				res.on('error', function (err) {
					console.error('error: ' + err.message);
				});
				res.on('end', function (result) {
					console.log('status: ' + result.status);
				});
			});
		});

		//this part is copied from local strategy, and doesnt make sense yet.

		let found = acceptedCredentials.find((credentials) => {
			return credentials.username == username
				&& credentials.password == password;
		});

		if (found) {
			return Promise.resolve(found);
		} else {
			return Promise.reject(new errors.NotAuthenticated('Wrong credentials'));
		}
		//ToDo: create User
	}
}

module.exports = LdapLoginStrategy;