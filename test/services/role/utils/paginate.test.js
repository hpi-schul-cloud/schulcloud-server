const { expect } = require('chai');

const { paginate } = require('../../../../src/services/role/utils');

describe('paginate', () => {
	const array = [
		{ key: 0, value: 'a' },
		{ key: 1, value: 'a' },
		{ key: 2, value: 'a' },
		{ key: 3, value: 'b' },
		{ key: 4, value: 'b' },
		{ key: 5, value: 'b' },
	];

	it('should paginate it', () => {
		const result = paginate(array);
		expect(result).to.deep.equal({
			total: 6,
			limit: 6,
			skip: 0,
			data: array,
		});
	});

	it('limit should work for paginate', () => {
		const result = paginate(array, { $limit: 3 });
		expect(result).to.deep.equal({
			total: 3,
			limit: 3,
			skip: 0,
			data: [
				{ key: 0, value: 'a' },
				{ key: 1, value: 'a' },
				{ key: 2, value: 'a' },
			],
		});
	});

	it('skip should work for paginate', () => {
		const result = paginate(array, { $skip: 3 });
		expect(result).to.deep.equal({
			total: 3,
			limit: 6,
			skip: 3,
			data: [
				{ key: 3, value: 'b' },
				{ key: 4, value: 'b' },
				{ key: 5, value: 'b' },
			],
		});
	});

	it('skip and limit should work together for paginate', () => {
		const result = paginate(array, { $skip: 3, $limit: 2 });
		expect(result).to.deep.equal({
			total: 2,
			limit: 2,
			skip: 3,
			data: [
				{ key: 3, value: 'b' },
				{ key: 4, value: 'b' },
			],
		});
	});

	it('already paginate results should pass', () => {
		const paginated = {
			total: 2,
			limit: 2,
			skip: 3,
			data: [
				{ key: 3, value: 'b' },
				{ key: 4, value: 'b' },
			],
		};

		const result = paginate(paginated, { $skip: 1, $limit: 4 });
		expect(result).to.deep.equal(paginated);
	});

	it('undefined should paginate', () => {
		const result = paginate(undefined, { $skip: 1, $limit: 4 });
		expect(result).to.deep.equal({
			total: 0,
			limit: 4,
			skip: 1,
			data: [],
		});
	});
});
