const logger = require('winston');
const promisify = require('es6-promisify');
const errors = require('feathers-errors');
const request = require('request-promise-native');
const ldap = require('ldapjs');

const AbstractLoginStrategy = require('./interface.js');

class LdapLoginStrategy extends AbstractLoginStrategy {

	login({ username, password }, system) {
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
				filter: 'uid=' + username,
				scope: 'sub',
				attributes: []
			};

			return new Promise((resolve, reject) => {
				client.search(`ou=${SCHOOL},${ldapRootPath}`, opts, function (err, res) {
					res.on('searchEntry', function (entry) {
						resolve(entry.object);
					});
					res.on('error', reject);
					// if the promise has not resolved by now, the user is not
					// a member of this school:
					res.on('end', reject);
				});
			});

			// TODO: create User based on search data
		}).then((user) => {
			console.log(user);
		});

	}
}

module.exports = LdapLoginStrategy;
