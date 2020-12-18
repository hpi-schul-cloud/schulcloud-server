import { expect } from 'chai';

import { sortByGradeAndOrName } from '../../../../src/services/user-group/hooks/helpers/classHooks';

describe('sorting method', () => {
	const defaultQuery = { year: 1, gradeLevel: 1, name: 1 };

	it('is returning a value when not provided a sortQuery', () => {
		const context = {
			params: {
				query: { $sort: {} },
			},
		};
		const result = sortByGradeAndOrName(context);
		expect(typeof result).to.equal('object');
		expect(result.params.query.$sort).to.deep.equal(defaultQuery);
	});

	it('is returning a value when not provided query', () => {
		const context = {
			params: {
				query: {},
			},
		};
		const result = sortByGradeAndOrName(context);
		expect(typeof result).to.equal('object');
		expect(result.params.query.$sort).to.deep.equal(defaultQuery);
	});

	it('is returning a value when not provided params', () => {
		const context = {
			params: {},
		};
		const result = sortByGradeAndOrName(context);
		expect(typeof result).to.equal('object');
		expect(result.params.query.$sort).to.deep.equal(defaultQuery);
	});

	it('is returning the correct order', () => {
		const sortQuery = { displayName: -1 };
		const context = {
			params: {
				query: { $sort: sortQuery },
			},
		};
		const result = sortByGradeAndOrName(context);
		expect(result.params.query.$sort).to.deep.equal({ gradeLevel: -1, name: -1 });
	});
});
