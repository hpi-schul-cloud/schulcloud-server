/* eslint-disable max-classes-per-file */
class ApplicationError extends Error {
	constructor(message) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

class SilentError extends ApplicationError {
}

class DocumentNotFound extends ApplicationError {
}

class ValidationError extends ApplicationError {
}

module.exports = {
	SilentError,
	DocumentNotFound,
	ValidationError,
};
