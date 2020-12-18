import { expect } from 'chai';
import { splitForSearchIndexes } from '../../src/utils/search.js';

describe('tests for search utils', () => {
	describe('util splitForSearchIndexes', () => {
		it('slitup one value', () => {
			const string = 'Hans Mustafa';
			const expected = ['H', 'Ha', 'Han', 'ans', 'M', 'Mu', 'Mus', 'ust', 'sta', 'taf', 'afa'];
			const result = splitForSearchIndexes(string);
			expect(result).to.be.deep.equals(expected);
		});

		it('slitup at dash', () => {
			const string = 'Hans-Mustafa';
			const expected = ['H', 'Ha', 'Han', 'ans', 'M', 'Mu', 'Mus', 'ust', 'sta', 'taf', 'afa'];
			const result = splitForSearchIndexes(string);
			expect(result).to.be.deep.equals(expected);
		});

		it('slitup two value', () => {
			const string1 = 'Hans P';
			const string2 = 'e@b.d';
			const expected = ['H', 'Ha', 'Han', 'ans', 'P', 'e', 'e@', 'e@b', '@b.', 'b.d'];
			const result = splitForSearchIndexes(string1, string2);
			expect(result).to.be.deep.equals(expected);
		});

		it('slitup three value', () => {
			const string1 = 'Hans';
			const string2 = 'Mustafa';
			const string3 = 'e@b.d';
			const expected = [
				'H',
				'Ha',
				'Han',
				'ans',
				'M',
				'Mu',
				'Mus',
				'ust',
				'sta',
				'taf',
				'afa',
				'e',
				'e@',
				'e@b',
				'@b.',
				'b.d',
			];
			const result = splitForSearchIndexes(string1, string2, string3);
			expect(result).to.be.deep.equals(expected);
		});
	});
});
