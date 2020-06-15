/* eslint-disable max-classes-per-file */
class ApplicationError extends Error {
	constructor(message) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

class SilentError extends ApplicationError {
	constructor(message) {
		super(message);
	}
}

module.exports = {
	SilentError,
};
