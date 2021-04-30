const { expect } = require('chai');

const { filterKeys, batchFilterKeys } = require('../../src/errors/applicationErrors').private;

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

describe.only('batchFilterKeys', () => {
	it('should correctly filter batch', () => {
		const subData = {
			a: 1,
			b: 2,
			d: 3,
		};

		const data = {
			user: subData,
			account: subData,
		};

		const allowedKeys = ['a', 'b', 'c'];
		const res = batchFilterKeys(data, allowedKeys);
		expect(res.user.a).to.be.not.undefined;
		expect(res.user.b).to.be.not.undefined;
		expect(res.user.c).to.be.undefined;
		expect(res.user.d).to.be.undefined;

		expect(res.account.a).to.be.not.undefined;
		expect(res.account.b).to.be.not.undefined;
		expect(res.account.c).to.be.undefined;
		expect(res.account.d).to.be.undefined;
	});
});
