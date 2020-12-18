import { expect } from 'chai';
import {
	errorMessage,
	getRestrictPopulatesHook,
	populateSelectHelper,
	preventPopulate,
} from '../../src/hooks/restrictPopulate';

describe('restrictPopulate Hook', () => {
	describe('populateSelectHelper', () => {
		it('should deny string that is not on whitelist', () => {
			const testwhitelist = {
				accepted: ['_id'],
			};

			try {
				populateSelectHelper('deny', testwhitelist);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.message).to.equal(errorMessage);
			}
		});

		it('should deny object that is not on whitelist', () => {
			const testwhitelist = {
				accepted: ['_id'],
			};

			try {
				populateSelectHelper({ path: 'deny' }, testwhitelist);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.message).to.equal(errorMessage);
			}
		});

		it('should select only whitelisted attributes for string', () => {
			const testwhitelist = {
				accepted: ['_id'],
			};

			const result = populateSelectHelper('accepted', testwhitelist);
			expect(result.path).to.equal('accepted');
			expect(Array.isArray(result.select)).to.be.true;
			expect(result.select.length).to.equal(1);
			expect(result.select[0]).to.equal('_id');
		});

		it('should select only whitelisted attributes for object', () => {
			const testwhitelist = {
				accepted: ['_id'],
			};

			const result = populateSelectHelper({ path: 'accepted' }, testwhitelist);
			expect(result.path).to.equal('accepted');
			expect(Array.isArray(result.select)).to.be.true;
			expect(result.select.length).to.equal(1);
			expect(result.select[0]).to.equal('_id');
		});

		it('should overwrite a select statement', () => {
			const testwhitelist = {
				accepted: ['_id'],
			};

			const result = populateSelectHelper({ path: 'accepted', select: ['secret'] }, testwhitelist);
			expect(result.path).to.equal('accepted');
			expect(Array.isArray(result.select)).to.be.true;
			expect(result.select.length).to.equal(1);
			expect(result.select[0]).to.equal('_id');
		});
	});

	describe('restrictPopulate', () => {
		it('should handle a single populate string', () => {
			const whitelist = {
				accepted: ['_id'],
			};
			const testContext = {
				params: {
					query: { $populate: 'accepted' },
				},
			};

			const hook = getRestrictPopulatesHook(whitelist);
			const result = hook(testContext);
			expect(result.params.query.$populate.path).to.equal('accepted');
			expect(result.params.query.$populate.select).to.include('_id');
			expect(result.params.query.$populate.select.length).to.equal(1);
		});

		it('should handle an array of populate strings', () => {
			const whitelist = {
				accepted: ['_id'],
				allowed: ['_id'],
			};
			const testContext = {
				params: {
					query: { $populate: ['accepted', 'allowed'] },
				},
			};

			const hook = getRestrictPopulatesHook(whitelist);
			const result = hook(testContext);
			expect(Array.isArray(result.params.query.$populate)).to.equal(true);
			result.params.query.$populate.forEach((el) => {
				expect(['accepted', 'allowed']).to.include(el.path);
				expect(el.select).to.include('_id');
				expect(el.select.length).to.equal(1);
			});
		});

		it('should pass when no populate is given', () => {
			const whitelist = {
				accepted: ['_id'],
				allowed: ['_id'],
			};
			const testContext = {
				params: { query: {} },
			};

			const hook = getRestrictPopulatesHook(whitelist);
			const result = hook(testContext);
			expect(result.params.query).to.not.haveOwnProperty('$populate');
		});
	});

	describe('preventPopulate', () => {
		it('should pass without $populate', () => {
			const testContext = {
				params: { query: {} },
			};
			const result = preventPopulate(testContext);
			expect(result).to.not.be.undefined;
		});

		it('should throw with $populate', () => {
			const testContext = {
				params: { query: { $populate: 'anything' } },
			};
			try {
				preventPopulate(testContext);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.message).to.equal(errorMessage);
			}
		});
	});
});
