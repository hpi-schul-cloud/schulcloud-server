/* eslint-disable no-unused-expressions */
/*
This is a port of the deprecated feathers-mongoose module to work with the new feathers version 5.
Codebase clone from https://github.com/feathersjs-ecosystem/feathers-mongoose
*/
const { expect } = require('chai');
const mongoose = require('mongoose');
const errors = require('@feathersjs/errors');

const { ERROR, errorHandler } = require('../../src/utils/feathers-mongoose/error-handler');

describe('Feathers Mongoose Error Handler', () => {
	it('throws a feathers error', async () => {
		const e = new errors.GeneralError();

		try {
			await errorHandler(e);
			throw new Error('Should never get here');
		} catch (error) {
			expect(error).to.be.an.instanceof(errors.GeneralError);
		}
	});

	it('wraps a ValidationError as a BadRequest', async () => {
		const e = new errors.GeneralError();

		e.name = 'ValidationError';
		e.errors = {};

		try {
			await errorHandler(e);
			throw new Error('Should never get here');
		} catch (error) {
			expect(error).to.be.an.instanceof(errors.BadRequest);
		}
	});

	it('preserves a validation error message', async () => {
		const e = new errors.GeneralError();

		e.name = 'ValidationError';
		e.errors = {};
		e.message = 'Invalid Email';

		try {
			await errorHandler(e);
			throw new Error('Should never get here');
		} catch (error) {
			expect(error.message).to.equal('Invalid Email');
		}
	});

	it('preserves a validation errors', async () => {
		const emailError = {
			email: {
				message: 'email cannot be null',
				type: 'notNull Violation',
				path: 'email',
				value: null,
			},
		};

		const e = new errors.GeneralError();

		e.name = 'ValidationError';
		e.errors = {};
		e.errors = emailError;

		try {
			await errorHandler(e);
		} catch (error) {
			expect(error.errors).to.deep.equal(emailError);
		}
	});

	it('wraps a ValidatorError as a BadRequest', async () => {
		const e = new errors.GeneralError();

		e.name = 'ValidationError';
		e.errors = {};

		try {
			await errorHandler(e);
			throw new Error('Should never get here');
		} catch (error) {
			expect(error).to.be.an.instanceof(errors.BadRequest);
		}
	});

	it('wraps a CastError as a BadRequest', async () => {
		const e = new mongoose.Error.CastError();

		try {
			await errorHandler(e);
			throw new Error('Should never get here');
		} catch (error) {
			expect(error).to.be.an.instanceof(errors.BadRequest);
		}
	});

	it('wraps a VersionError as a BadRequest', async () => {
		const e = new mongoose.Error.VersionError({ _id: 'testing' }, null, []);

		try {
			await errorHandler(e);
			throw new Error('Should never get here');
		} catch (error) {
			expect(error).to.be.an.instanceof(errors.BadRequest);
		}
	});

	it('wraps a OverwriteModelError as a Conflict', async () => {
		const e = new mongoose.Error.OverwriteModelError();

		try {
			await errorHandler(e);
			throw new Error('Should never get here');
		} catch (error) {
			expect(error).to.be.an.instanceof(errors.Conflict);
		}
	});

	it('wraps a MissingSchemaError as a GeneralError', async () => {
		const e = new mongoose.Error.MissingSchemaError();

		try {
			await errorHandler(e);
			throw new Error('Should never get here');
		} catch (error) {
			expect(error).to.be.an.instanceof(errors.GeneralError);
		}
	});

	it('wraps a DivergentArrayError as a GeneralError', async () => {
		const fn = function () {};
		const e = new mongoose.Error.DivergentArrayError({ join: fn });

		try {
			await errorHandler(e);
			throw new Error('Should never get here');
		} catch (error) {
			expect(error).to.be.an.instanceof(errors.GeneralError);
		}
	});

	describe('DuplicateKey error', () => {
		it('gets wrapped as a Conflict error', async () => {
			const e = Error('E11000 duplicate key error collection: db.users index: name_1 dup key: { : "Kate" }');
			e.name = 'MongoError';
			e.code = 11000;

			try {
				await errorHandler(e);
				throw new Error('Should never get here');
			} catch (error) {
				expect(error).to.be.an.instanceof(errors.Conflict);
			}
		});

		it('has the correct error message #1', async () => {
			const e = Error('E11000 duplicate key error collection: db.users index: name_1 dup key: { : "Kate" }');
			e.name = 'MongoError';
			e.code = 11000;

			try {
				await errorHandler(e);
				throw new Error('Should never get here');
			} catch (error) {
				expect(error.message).to.equal('name: Kate already exists.');
			}
		});

		it('has the correct error message #2', async () => {
			const e = Error(
				"E11000 duplicate key error index: myDb.myCollection.$id dup key: { : ObjectId('57226808ec55240c00000272') }"
			);
			e.name = 'MongoError';
			e.code = 11000;

			try {
				await errorHandler(e);
				throw new Error('Should never get here');
			} catch (error) {
				expect(error.message).to.equal("id: ObjectId('57226808ec55240c00000272') already exists.");
			}
		});

		it('has the correct errors object #1', async () => {
			const e = Error('E11000 duplicate key error index: test.collection.$a.b_1 dup key: { : null }');
			e.name = 'MongoError';
			e.code = 11000;

			try {
				await errorHandler(e);
				throw new Error('Should never get here');
			} catch (error) {
				expect(error.errors).to.deep.equal({ b: null });
			}
		});

		it('has the correct errors object #2', async () => {
			const e = Error('E11000 duplicate key error collection: db.users index: name_1 dup key: { : "Kate" }');
			e.name = 'MongoError';
			e.code = 11000;

			try {
				await errorHandler(e);
				throw new Error('Should never get here');
			} catch (error) {
				expect(error.errors).to.deep.equal({ name: 'Kate' });
			}
		});

		it('returns the original error', async () => {
			const e = new Error('E11000 duplicate key error collection: db.users index: name_1 dup key: { : "Kate" }');
			e.name = 'MongoError';
			e.code = 11000;

			try {
				await errorHandler(e);
				throw new Error('Should never get here');
			} catch (error) {
				expect(error[ERROR]).to.deep.equal(e);
			}
		});
	});
});
