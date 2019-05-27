const { expect } = require('chai');
const { flatten, paginate } = require('../../src/utils/array');

describe('array helpers', () => {
	describe('#flatten', () => {
		it('should work on empty arrays', () => {
			expect(flatten([])).to.deep.equal([]);
		});

		it('should work on flat arrays', () => {
			expect(flatten([1, 2, 3])).to.deep.equal([1, 2, 3]);
		});

		it('should work on nested arrays', () => {
			expect(flatten([1, [2], 3])).to.deep.equal([1, 2, 3]);
		});

		it('should work on deeply nested arrays', () => {
			expect(flatten([1, 2, [[[[3]]]]])).to.deep.equal([1, 2, 3]);
		});

		it('should work on arrays which are nested multiple times', () => {
			expect(flatten([[1], [2, 3], [[4], 5]])).to.deep.equal([1, 2, 3, 4, 5]);
		});
	});

	describe('#paginate', () => {
		it('should return the original array if pagination is disabled via params', () => {
			expect(() => paginate([])).not.to.throw(Error);
			expect(paginate([])).to.deep.equal([]);
			expect(paginate([1, 2, 3])).to.deep.equal([1, 2, 3]);
			expect(paginate([1, 2, 3]), { paginate: false }).to.deep.equal([1, 2, 3]);
		});

		it('should emulate feathers pagination', () => {
			expect(paginate([1, 2, 3], { paginate: true })).to.deep.equal({
				total: 3,
				skip: 0,
				limit: 3,
				data: [1, 2, 3],
			});
		});

		it('should work on empty arrays', () => {
			expect(paginate([], { paginate: true })).to.deep.equal({
				total: 0,
				skip: 0,
				limit: 0,
				data: [],
			});
		});

		describe('$skip', () => {
			it('should not return skipped elements', () => {
				expect(paginate([1, 2, 3, 4], {
					paginate: true,
					$skip: 1,
				})).to.deep.equal({
					total: 4,
					skip: 1,
					limit: 4,
					data: [2, 3, 4],
				});

				expect(paginate([1, 2, 3, 4], {
					paginate: true,
					$skip: 3,
				})).to.deep.equal({
					total: 4,
					skip: 3,
					limit: 4,
					data: [4],
				});
			});

			it('should work for skip > total', () => {
				expect(paginate([1, 2, 3, 4], {
					paginate: true,
					$skip: 25,
				})).to.deep.equal({
					total: 4,
					skip: 25,
					limit: 4,
					data: [],
				});
			});

			it('should work for skip < 0', () => {
				expect(paginate([1, 2, 3, 4], {
					paginate: true,
					$skip: -3,
				})).to.deep.equal({
					total: 4,
					skip: 0,
					limit: 4,
					data: [1, 2, 3, 4],
				});
			});
		});

		describe('$limit', () => {
			it('should limit the result length', () => {
				expect(paginate([1, 2, 3, 4], {
					paginate: true,
					$limit: 2,
				})).to.deep.equal({
					total: 4,
					skip: 0,
					limit: 2,
					data: [1, 2],
				});

				expect(paginate([1, 2, 3, 4], {
					paginate: true,
					$limit: 1,
				})).to.deep.equal({
					total: 4,
					skip: 0,
					limit: 1,
					data: [1],
				});
			});

			it('should work for limit < 0', () => {
				expect(paginate([1, 2, 3, 4], {
					paginate: true,
					$limit: -3,
				})).to.deep.equal({
					total: 4,
					skip: 0,
					limit: 4,
					data: [1, 2, 3, 4],
				});
			});

			it('should work for limit > length', () => {
				expect(paginate([1, 2, 3, 4], {
					paginate: true,
					$limit: 22,
				})).to.deep.equal({
					total: 4,
					skip: 0,
					limit: 22,
					data: [1, 2, 3, 4],
				});
			});
		});

		it('should work with $limit and $skip set', () => {
			expect(paginate([1, 2, 3, 4, 5, 6, 7], {
				paginate: true,
				$limit: 2,
				$skip: 2,
			})).to.deep.equal({
				total: 7,
				skip: 2,
				limit: 2,
				data: [3, 4],
			});

			expect(paginate([1, 2, 3, 4, 5, 6, 7], {
				paginate: true,
				$limit: 5,
				$skip: 2,
			})).to.deep.equal({
				total: 7,
				skip: 2,
				limit: 5,
				data: [3, 4, 5, 6, 7],
			});

			expect(paginate([1, 2, 3, 4, 5, 6, 7], {
				paginate: true,
				$limit: 1,
				$skip: 5,
			})).to.deep.equal({
				total: 7,
				skip: 5,
				limit: 1,
				data: [6],
			});
		});
	});
});
