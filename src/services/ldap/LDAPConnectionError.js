const reqlib = require('app-root-path').require;

const { ApplicationError } = reqlib('src/errors');

class LDAPConnectionError extends ApplicationError {
	constructor(message, data = {}) {
		super(message);
		this.data = data;
	}
}

module.exports = LDAPConnectionError;
