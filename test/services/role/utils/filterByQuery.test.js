const { expect } = require('chai');

const { filterByQuery } = require('../../../../src/services/role/utils');

describe('filterByQuery', () => {
	const array = [
		{ key: 0, value: 'a1', userId: ['123', '234', '456'] },
		{ key: 1, value: 'a2' },
		{ key: 2, value: 'a3' },
		{ key: 3, value: 'b1', userId: ['123'] },
		{ key: 4, value: 'b2' },
		{ key: 5, value: 'b3', userId: ['234'] },
	];

	it('should work without query', () => {
		const result = filterByQuery(array);
		expect(result).to.deep.equal(array);
	});

	it('should not touch $skip and $limit', () => {
		const result = filterByQuery(array, { $skip: 1, $limit: 3 });
		expect(result).to.deep.equal(array);
	});

	it('shift filter should work', () => {
		const result = filterByQuery(array, { userId: { $in: ['234', '123'] } });
		expect(result).to.deep.equal([
			{ key: 0, value: 'a1', userId: ['123', '234', '456'] },
			{ key: 3, value: 'b1', userId: ['123'] },
			{ key: 5, value: 'b3', userId: ['234'] },
		]);
	});

	it('regex filter should work', () => {
		const result = filterByQuery(array, { value: /a/i });
		expect(result).to.deep.equal([
			{ key: 0, value: 'a1', userId: ['123', '234', '456'] },
			{ key: 1, value: 'a2' },
			{ key: 2, value: 'a3' },
		]);
	});

	it('all together should work', () => {
		const result = filterByQuery(array, {
			$skip: 1,
			$limit: 3,
			value: /a/i,
			userId: { $in: ['123'] },
		});
		expect(result).to.deep.equal([
			{ key: 0, value: 'a1', userId: ['123', '234', '456'] },
		]);
	});
});
