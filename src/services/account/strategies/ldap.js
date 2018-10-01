const logger = require('winston');
const promisify = require('es6-promisify');
const errors = require('feathers-errors');
const request = require('request-promise-native');
const ldap = require('ldapjs');

const AbstractLoginStrategy = require('./interface.js');

const acceptedCredentials = [
	{username: 'a', password: 'a'},	// administrator
	{username: 'lehrer@schul-cloud.org', password: 'schulcloud'},	// teacher
	{username: 'schueler@schul-cloud.org', password: 'schulcloud'}	// student
];

class LdapLoginStrategy extends AbstractLoginStrategy {
    

	login({ username, password}, system) {

        const client = ldap.createClient({
            url: 'ldaps://idm.niedersachsen.cloud:7636'
          });

        client.bind(process.env.LDAPUSER, process.env.LDAPPW, function(err) {
            if (err) return Promise.reject(err);
        });

        //ToDo: wait for successful bind, make a testsearch

        //this part is copied from local strategy, and doesnt make sense yet.

		let found = acceptedCredentials.find((credentials) => {
				return credentials.username == username
					&& credentials.password == password;
            });
            
		if(found) {
			return Promise.resolve(found);
		} else {
			return Promise.reject(new errors.NotAuthenticated('Wrong credentials'));
        }
        //ToDo: create User
	}
}

module.exports = LdapLoginStrategy;