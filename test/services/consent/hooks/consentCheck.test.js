const { expect } = require('chai');
const { restrictToCurrentUser } = require('../../../../src/services/consent/hooks/consentCheck');

describe('test consentCheck hooks', () => {
	it('restict to current user', () => {
		const someUserId = 'Affen tanzen tango';
		const context = {
			params: {
				route: {
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

	it('unequal current user', () => {
		const someUserId = 'Affen tanzen tango';
		const someOtherId = 'This ape do not like tango';
		const context = {
			params: {
				route: {
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
			expect(err.code).to.equal(403);
		}
	});
});
