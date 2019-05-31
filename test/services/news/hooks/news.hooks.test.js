const { expect } = require('chai');
const {
	preparePagination,
	lookupSchool,
	deleteNewsHistory,
} = require('./../../../../src/services/news/hooks/news.hooks');

describe('#preparePagination', () => {
	it('should convert the $paginate query parameter from a string to boolean', () => {
		const context = {
			params: {
				query: {
					$paginate: 'true',
				},
			},
		};
		expect(() => preparePagination(context)).not.to.throw(Error);
		expect(preparePagination(context).params.query).to.deep.equal({ $paginate: true });

		context.params.query.$paginate = 'false';
		expect(() => preparePagination(context)).not.to.throw(Error);
		expect(preparePagination(context).params.query).to.deep.equal({ $paginate: false });
	});

	it('should work if no query is given', () => {
		const context = {
			params: {},
		};
		expect(() => preparePagination(context)).not.to.throw(Error);
		expect(preparePagination(context)).to.deep.equal(context);
	});
});
