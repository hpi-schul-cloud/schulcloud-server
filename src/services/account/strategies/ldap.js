const logger = require('winston');
const promisify = require('es6-promisify');
const errors = require('feathers-errors');
const request = require('request-promise-native');
const ldap = require('ldapjs');

const AbstractLoginStrategy = require('./interface.js');

class LdapLoginStrategy extends AbstractLoginStrategy {

	login({ username, password }, system) {
		const SCHOOL = 'N21Testschule'; // TODO: use user's school id (needs real data in DB/IDM)

		const client = ldap.createClient({
			url: 'ldaps://idm.niedersachsen.cloud:636' // TODO: port 7636 throws self-signed certificate error
		});

		const ldapRootPath = 'dc=idm,dc=nbc';
		const qualifiedUser = `uid=${username},cn=users,${ldapRootPath}`;

        const client = ldap.createClient({
	        url: 'ldaps://idm.niedersachsen.cloud:636'
	    });

        return new Promise((reject, resolve) => {
			client.bind(qualifiedUser, password || process.env.LDAPPW, function(err) {
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

        	return new Promise((reject, resolve) => {
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

			// TODO: create User based on search data
        }).then((user) => {
			console.log(user);
		});

	}
}

module.exports = LdapLoginStrategy;
