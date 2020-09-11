/* eslint-disable max-classes-per-file */
// TODO: location in middleware is the wrong place for it
class ApplicationError extends Error {
	constructor(message) {
		super(message);
		this.name = this.constructor.name;
		Error.captureStackTrace(this, this.constructor);
	}
}

class SilentError extends ApplicationError {}

module.exports = {
	SilentError,
};
