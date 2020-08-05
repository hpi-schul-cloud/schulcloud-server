const { expect } = require('chai');
const { restrictToCurrentUser } = require('../../../services/consent/hooks/consentCheck');

describe('test consentCheck hooks', () => {
	it('restict to current user find', () => {
		const someUserId = 'Affen tanzen tango';
		const context = {
			params: {
				query: {
					userId: someUserId,
				},
				authentication: {
					payload: {
						userId: someUserId,
					},
				},
			},
		};
		const res = restrictToCurrentUser(context);
		expect(res).to.deep.equal(context);
	});

	it('restict to current user get', () => {
		const someUserId = 'Affen tanzen tango';
		const context = {
			id: someUserId,
			params: {
				authentication: {
					payload: {
						userId: someUserId,
					},
				},
			},
		};
		const res = restrictToCurrentUser(context);
		expect(res).to.deep.equal(context);
	});

	it('unequal current user find', () => {
		const someUserId = 'Affen tanzen tango';
		const someOtherId = 'This ape do not like tango';
		const context = {
			params: {
				query: {
					userId: someUserId,
				},
				authentication: {
					payload: {
						userId: someOtherId,
					},
				},
			},
		};

		try {
			const res = restrictToCurrentUser(context);
			expect(res).to.be.undefined;
		} catch (err) {
			expect(err).to.be.not.undefined;
			expect(err.status).to.equal(403);
		}
	});

	it('unequal current user get', () => {
		const someUserId = 'Affen tanzen tango';
		const someOtherId = 'This ape do not like tango';
		const context = {
			id: someUserId,
			params: {
				authentication: {
					payload: {
						userId: someOtherId,
					},
				},
			},
		};

		try {
			const res = restrictToCurrentUser(context);
			expect(res).to.be.undefined;
		} catch (err) {
			expect(err).to.be.not.undefined;
			expect(err.status).to.equal(403);
		}
	});
});
