const { expect } = require('chai');

const { filterKeys } = require('../../src/errors/applicationErrors').private;

describe('filterKeys', () => {
	it('should correctly filter keys which are not allowed', () => {
		const data = {
			a: 1,
			b: 2,
			d: 3,
		};
		const allowedKeys = ['a', 'b', 'c'];
		const res = filterKeys(data, allowedKeys);
		expect(res.a).to.be.not.undefined;
		expect(res.b).to.be.not.undefined;
		expect(res.c).to.be.undefined;
		expect(res.d).to.be.undefined;
	});
});
