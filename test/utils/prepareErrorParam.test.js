const { expect } = require('chai');
const { BadRequest, GeneralError } = require('@feathersjs/errors');
const { prepareErrorParam } = require('../../src/utils');

describe('utils prepareErrorParam', async () => {
	it('should work for intern feather errors', () => {
		let internError;
		try {
			try {
				throw new BadRequest('Feathers intern.');
			} catch (err) {
				internError = err;
				throw new BadRequest('Feathers extern', prepareErrorParam(err));
			}
		} catch (err) {
			expect(err.data).to.deep.equal({
				code: internError.code,
				stack: internError.stack,
				message: internError.message,
				className: internError.className,
				name: internError.name,
				type: internError.type,
			});
		}
	});

	it('should work for intern errors', () => {
		let internError;
		try {
			try {
				throw new Error('Feathers intern.');
			} catch (err) {
				internError = err;
				throw new BadRequest('Feathers extern', prepareErrorParam(err));
			}
		} catch (err) {
			expect(err.data).to.deep.equal({
				stack: internError.stack,
				message: internError.message,
				name: internError.name,
			});
		}
	});

	it('should work for random errors', () => {
		let internError;
		try {
			try {
				null.forEach((r) => r);
			} catch (err) {
				internError = err;
				throw new BadRequest('Feathers extern', prepareErrorParam(err));
			}
		} catch (err) {
			expect(err.data).to.deep.equal({
				stack: internError.stack,
				message: internError.message,
				name: internError.name,
			});
		}
	});

	it('should work with feather general error', () => {
		let internError;
		try {
			try {
				null.forEach((r) => r);
			} catch (err) {
				internError = err;
				throw new GeneralError('Feathers extern', prepareErrorParam(err));
			}
		} catch (err) {
			expect(err.data).to.deep.equal({
				stack: internError.stack,
				message: internError.message,
				name: internError.name,
			});
		}
	});

	it('is needed until feathers can not handle it', () => {
		try {
			try {
				null.forEach((r) => r);
			} catch (err) {
				throw new BadRequest('Feathers extern', err);
			}
		} catch (err) {
			expect(err.data, 'Is error is pass, the util can removed.').to.be.empty;
			expect(err.errors, 'Is error is pass, the util can removed.').to.be.empty;
		}
	});
});
