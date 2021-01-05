const { ApplicationError } = require('../../errors');

const GENERIC_LDAP_ERROR = {
	type: 'LDAP_CONNECTION_ERROR',
	title: 'LDAP connection error',
	defaultMessage: 'Error while connecting to LDAP Server',
};

class LDAPConnectionError extends ApplicationError {
	constructor(data = {}) {
		super(GENERIC_LDAP_ERROR);
		this.data = data;
	}
}

module.exports = LDAPConnectionError;
