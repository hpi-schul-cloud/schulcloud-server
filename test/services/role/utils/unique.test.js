const { expect } = require('chai');

const { unique } = require('../../../../src/services/role/utils');

describe('unique', () => {
	it('should work', () => {
		const result = unique(['a', 'b', 'c'], ['b', 'c', 'd'], ['c', 'd', 'e']);
		expect(result).to.deep.equal(['a', 'b', 'c', 'd', 'e']);
	});

	it.skip('should work with undefined and null', () => {
		const result = unique(['a', 'b', 'c'], undefined, null);
		expect(result).to.deep.equal(['a', 'b', 'c']);
	});
});
