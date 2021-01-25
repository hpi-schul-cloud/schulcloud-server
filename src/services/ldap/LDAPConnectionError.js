const { ApplicationError } = require('../../errors');

class LDAPConnectionError extends ApplicationError {
	constructor(message, data = {}) {
		super(message);
		this.data = data;
	}
}

module.exports = LDAPConnectionError;
