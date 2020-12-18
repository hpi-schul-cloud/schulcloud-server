import { expect } from 'chai';
import { flatten, paginate, sort } from '../../../src/utils/array';

describe('[utils] array helpers', () => {
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
			expect(paginate([1, 2, 3]), { $paginate: false }).to.deep.equal([1, 2, 3]);
		});

		it('should emulate feathers pagination', () => {
			expect(paginate([1, 2, 3], { $paginate: true })).to.deep.equal({
				total: 3,
				skip: 0,
				limit: 3,
				data: [1, 2, 3],
			});
		});

		it('should work on empty arrays', () => {
			expect(paginate([], { $paginate: true })).to.deep.equal({
				total: 0,
				skip: 0,
				limit: 0,
				data: [],
			});
		});

		describe('$skip', () => {
			it('should not return skipped elements', () => {
				expect(
					paginate([1, 2, 3, 4], {
						$paginate: true,
						$skip: 1,
					})
				).to.deep.equal({
					total: 4,
					skip: 1,
					limit: 4,
					data: [2, 3, 4],
				});

				expect(
					paginate([1, 2, 3, 4], {
						$paginate: true,
						$skip: 3,
					})
				).to.deep.equal({
					total: 4,
					skip: 3,
					limit: 4,
					data: [4],
				});
			});

			it('should work for skip > total', () => {
				expect(
					paginate([1, 2, 3, 4], {
						$paginate: true,
						$skip: 25,
					})
				).to.deep.equal({
					total: 4,
					skip: 25,
					limit: 4,
					data: [],
				});
			});

			it('should work for skip < 0', () => {
				expect(
					paginate([1, 2, 3, 4], {
						$paginate: true,
						$skip: -3,
					})
				).to.deep.equal({
					total: 4,
					skip: 0,
					limit: 4,
					data: [1, 2, 3, 4],
				});
			});
		});

		describe('$limit', () => {
			it('should limit the result length', () => {
				expect(
					paginate([1, 2, 3, 4], {
						$paginate: true,
						$limit: 2,
					})
				).to.deep.equal({
					total: 4,
					skip: 0,
					limit: 2,
					data: [1, 2],
				});

				expect(
					paginate([1, 2, 3, 4], {
						$paginate: true,
						$limit: 1,
					})
				).to.deep.equal({
					total: 4,
					skip: 0,
					limit: 1,
					data: [1],
				});
			});

			it('should work for limit < 0', () => {
				expect(
					paginate([1, 2, 3, 4], {
						$paginate: true,
						$limit: -3,
					})
				).to.deep.equal({
					total: 4,
					skip: 0,
					limit: 4,
					data: [1, 2, 3, 4],
				});
			});

			it('should work for limit > length', () => {
				expect(
					paginate([1, 2, 3, 4], {
						$paginate: true,
						$limit: 22,
					})
				).to.deep.equal({
					total: 4,
					skip: 0,
					limit: 22,
					data: [1, 2, 3, 4],
				});
			});
		});

		it('should work with $limit and $skip set', () => {
			expect(
				paginate([1, 2, 3, 4, 5, 6, 7], {
					$paginate: true,
					$limit: 2,
					$skip: 2,
				})
			).to.deep.equal({
				total: 7,
				skip: 2,
				limit: 2,
				data: [3, 4],
			});

			expect(
				paginate([1, 2, 3, 4, 5, 6, 7], {
					$paginate: true,
					$limit: 5,
					$skip: 2,
				})
			).to.deep.equal({
				total: 7,
				skip: 2,
				limit: 5,
				data: [3, 4, 5, 6, 7],
			});

			expect(
				paginate([1, 2, 3, 4, 5, 6, 7], {
					$paginate: true,
					$limit: 1,
					$skip: 5,
				})
			).to.deep.equal({
				total: 7,
				skip: 5,
				limit: 1,
				data: [6],
			});
		});
	});

	describe('#sort', () => {
		it('should work on empty arrays', () => {
			expect(() => sort([])).not.to.throw(Error);
			expect(sort([])).to.deep.equal([]);
		});

		it('should work without sortOrder', () => {
			expect(() => sort([3, 1, 2])).not.to.throw(Error);
			expect(sort([3, 1, 2])).to.deep.equal([1, 2, 3]);
			expect(sort([5, 6, 1, 9, 2, 5, 5, 7])).to.deep.equal([1, 2, 5, 5, 5, 6, 7, 9]);
		});

		it('should return undefined if given an undefined array', () => {
			expect(() => sort()).not.to.throw(Error);
			expect(sort(undefined)).to.equal(undefined);
		});

		it('should sort by nested attributes if sortOrder string is given', () => {
			const data = [
				{ a: 1, foo: 3 },
				{ a: 5, foo: 1 },
				{ a: 2, foo: 8 },
			];
			expect(sort(data, 'a')).to.deep.equal([
				{ a: 1, foo: 3 },
				{ a: 2, foo: 8 },
				{ a: 5, foo: 1 },
			]);
			expect(sort(data, '-a')).to.deep.equal([
				{ a: 5, foo: 1 },
				{ a: 2, foo: 8 },
				{ a: 1, foo: 3 },
			]);
			expect(sort(data, 'foo')).to.deep.equal([
				{ a: 5, foo: 1 },
				{ a: 1, foo: 3 },
				{ a: 2, foo: 8 },
			]);
			expect(sort(data, '-foo')).to.deep.equal([
				{ a: 2, foo: 8 },
				{ a: 1, foo: 3 },
				{ a: 5, foo: 1 },
			]);
		});

		it('should sort on value if sortOrder is "" or "-"', () => {
			expect(() => sort([1, 3, 2], '')).not.to.throw(Error);
			expect(sort([1, 3, 2], '')).to.deep.equal([1, 2, 3]);
			expect(sort([1, 3, 2], '-')).to.deep.equal([3, 2, 1]);
		});

		it('should sort based on sortOrder objects', () => {
			const data = [
				{ a: 1, foo: 3 },
				{ a: 5, foo: 1 },
				{ a: 2, foo: 8 },
			];
			expect(sort(data, { a: 1 })).to.deep.equal([
				{ a: 1, foo: 3 },
				{ a: 2, foo: 8 },
				{ a: 5, foo: 1 },
			]);
			expect(sort(data, { a: -1 })).to.deep.equal([
				{ a: 5, foo: 1 },
				{ a: 2, foo: 8 },
				{ a: 1, foo: 3 },
			]);
			expect(sort(data, { foo: 1 })).to.deep.equal([
				{ a: 5, foo: 1 },
				{ a: 1, foo: 3 },
				{ a: 2, foo: 8 },
			]);
			expect(sort(data, { foo: -1 })).to.deep.equal([
				{ a: 2, foo: 8 },
				{ a: 1, foo: 3 },
				{ a: 5, foo: 1 },
			]);
		});

		it('should sort based on complex sortOrder objects', () => {
			const data = [
				{ a: 1, foo: 3 },
				{ a: 1, foo: 1 },
				{ a: 3, foo: 9 },
				{ a: 2, foo: 8 },
				{ a: 2, foo: 5 },
				{ a: 2, foo: 8 },
			];
			expect(sort(data, { a: 1, foo: 1 })).to.deep.equal([
				{ a: 1, foo: 1 },
				{ a: 1, foo: 3 },
				{ a: 2, foo: 5 },
				{ a: 2, foo: 8 },
				{ a: 2, foo: 8 },
				{ a: 3, foo: 9 },
			]);
			expect(sort(data, { foo: 1 })).to.deep.equal([
				{ a: 1, foo: 1 },
				{ a: 1, foo: 3 },
				{ a: 2, foo: 5 },
				{ a: 2, foo: 8 },
				{ a: 2, foo: 8 },
				{ a: 3, foo: 9 },
			]);
			expect(sort(data, { foo: -1, a: -1 })).to.deep.equal([
				{ a: 3, foo: 9 },
				{ a: 2, foo: 8 },
				{ a: 2, foo: 8 },
				{ a: 2, foo: 5 },
				{ a: 1, foo: 3 },
				{ a: 1, foo: 1 },
			]);
		});
	});
});
