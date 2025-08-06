const { expect } = require('chai');
const { splitForSearchIndexes } = require('../../src/utils/search.js');

describe('tests for search utils', () => {
	describe('util splitForSearchIndexes', () => {
		it('slitup one value', () => {
			const string = 'Hans Mustafa';
			const expected = [
				'Han',
				'Hans',
				'ans',
				'Mus',
				'Must',
				'Musta',
				'Mustaf',
				'Mustafa',
				'ust',
				'usta',
				'ustaf',
				'ustafa',
				'sta',
				'staf',
				'stafa',
				'taf',
				'tafa',
				'afa',
			];
			const result = splitForSearchIndexes(string);
			expect(result).to.be.deep.equals(expected);
		});

		it('slitup at dash', () => {
			const string = 'Hans-Mustafa';
			const expected = [
				'Han',
				'Hans',
				'ans',
				'Mus',
				'Must',
				'Musta',
				'Mustaf',
				'Mustafa',
				'ust',
				'usta',
				'ustaf',
				'ustafa',
				'sta',
				'staf',
				'stafa',
				'taf',
				'tafa',
				'afa',
			];
			const result = splitForSearchIndexes(string);
			expect(result).to.be.deep.equals(expected);
		});

		it('slitup two value', () => {
			const string1 = 'Hans P';
			const string2 = 'e@b.d';
			const expected = ['Han', 'Hans', 'ans', 'e@b', 'e@b.', 'e@b.d', '@b.', '@b.d', 'b.d'];
			const result = splitForSearchIndexes(string1, string2);
			expect(result).to.be.deep.equals(expected);
		});

		it('slitup three value', () => {
			const string1 = 'Hans';
			const string2 = 'Mustafa';
			const string3 = 'e@b.d';
			const expected = [
				'Han',
				'Hans',
				'ans',
				'Mus',
				'Must',
				'Musta',
				'Mustaf',
				'Mustafa',
				'ust',
				'usta',
				'ustaf',
				'ustafa',
				'sta',
				'staf',
				'stafa',
				'taf',
				'tafa',
				'afa',
				'e@b',
				'e@b.',
				'e@b.d',
				'@b.',
				'@b.d',
				'b.d',
			];
			const result = splitForSearchIndexes(string1, string2, string3);
			expect(result).to.be.deep.equals(expected);
		});
	});
});
