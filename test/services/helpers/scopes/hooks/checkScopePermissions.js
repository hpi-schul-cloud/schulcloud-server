const { expect } = require('chai');
const { BadRequest, Forbidden } = require('@feathersjs/errors');
const { ObjectId } = require('mongoose').Types;

const {
	checkScopePermissions,
} = require('../../../../../src/services/helpers/scopePermissions/hooks/checkScopePermissions');

const ALLOWED_USER_ID = (new ObjectId()).toString();
const getContext = ({ userId, omitHandler }) => ({
	path: '/chocolateBars/42/members',
	params: {
		account: {
			userId,
		},
		route: {
			scopeId: 42,
		},
	},
	app: {
		service: (name) => {
			if (name === '/chocolateBars/:scopeId/userPermissions') {
				return omitHandler ? undefined : {
					get: (id) => (id === ALLOWED_USER_ID ? ['EAT', 'THROW_AWAY'] : []),
				};
			}
			return undefined;
		},
	},
});

describe('checkScopePermissions', () => {
	const fut = checkScopePermissions;

	it('should return a hook function if given a list of permissions', () => {
		const hook = fut(['one', 'two', 'three']);
		expect(hook).to.be.instanceOf(Function);
	});

	it('should fail if no scope is given', async () => {
		try {
			await fut(['SOME_PERMISSION'])();
			throw new Error('This should never happen');
		} catch (err) {
			expect(err).to.be.instanceOf(BadRequest);
		}
	});

	it('should fail if no userPermission service is registered for the scope', async () => {
		const context = getContext({ omitHandler: true });
		try {
			await fut(['DRINK'])(context);
			throw new Error('This should never happen');
		} catch (err) {
			expect(err).to.be.instanceOf(BadRequest);
			expect(err.message).to.equal('There is no userPermission service for the scope \'chocolateBars\'.');
		}
	});

	it('should use the scope\'s userPermission service to resolve permissions', async () => {
		const context = getContext({ userId: ALLOWED_USER_ID });
		try {
			await fut(['DRINK'])(context);
			throw new Error('This should never happen');
		} catch (err) {
			expect(err).to.be.instanceOf(Forbidden);
			expect(err.message).to.include('Missing one of the required permissions');
		}
		try {
			const result = await fut(['EAT'])(context);
			expect(result).to.deep.equal(context);
		} catch (err) {
			expect.fail('This call should not have failed.');
		}
	});

	it('should work if no permissions are needed', async () => {
		const context = getContext({ userId: ALLOWED_USER_ID });
		try {
			const result = await fut([])(context);
			expect(result).to.deep.equal(context);
		} catch (err) {
			expect.fail('This call should not have failed.');
		}

		context.userId = (new ObjectId()).toString();
		try {
			const result = await fut([])(context);
			expect(result).to.deep.equal(context);
		} catch (err) {
			expect.fail('This call should not have failed.');
		}
	});

	it('should work for multiple permissions at the same time', async () => {
		const context = getContext({ userId: ALLOWED_USER_ID });
		try {
			const result = await fut(['EAT', 'THROW_AWAY'])(context);
			expect(result).to.deep.equal(context);
		} catch (err) {
			expect.fail('This call should not have failed.');
		}
		try {
			await fut(['DRINK', 'DIP'])(context);
			throw new Error('This should never happen');
		} catch (err) {
			expect(err).to.be.instanceOf(Forbidden);
			expect(err.message).to.include('Missing one of the required permissions');
		}
	});

	it('should only allow access if all permissions are granted', async () => {
		const context = getContext({ userId: ALLOWED_USER_ID });
		try {
			await fut(['EAT', 'DRINK'])(context);
			throw new Error('This should never happen');
		} catch (err) {
			expect(err).to.be.instanceOf(Forbidden);
			expect(err.message).to.include('Missing one of the required permissions');
		}
	});

	it('should not allow access for users without the required permissions', async () => {
		const context = getContext({ userId: (new ObjectId()).toString() });
		try {
			await fut(['DRINK'])(context);
			throw new Error('This should never happen');
		} catch (err) {
			expect(err).to.be.instanceOf(Forbidden);
			expect(err.message).to.include('Missing one of the required permissions');
		}
		try {
			await fut(['EAT'])(context);
			throw new Error('This should never happen');
		} catch (err) {
			expect(err).to.be.instanceOf(Forbidden);
			expect(err.message).to.include('Missing one of the required permissions');
		}
	});
});
