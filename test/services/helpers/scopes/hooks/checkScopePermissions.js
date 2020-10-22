const { expect } = require('chai');
const { ObjectId } = require('mongoose').Types;
const reqlib = require('app-root-path').require;

const { BadRequest, Forbidden } = reqlib('src/errors');
const {
	getScopePermissions,
	checkScopePermissions,
} = require('../../../../../src/services/helpers/scopePermissions/hooks/checkScopePermissions');

const ALLOWED_USER_ID = new ObjectId().toString();
const ALLOWED_USER_PERMISSIONS = ['EAT', 'THROW_AWAY'];
const EXISTING_SCOPE = 'chocolateBars';
const getApp = (omitHandler) => ({
	service: (name) => {
		if (name === `/${EXISTING_SCOPE}/:scopeId/userPermissions`) {
			return omitHandler
				? undefined
				: {
						get: (id) => (id === ALLOWED_USER_ID ? ALLOWED_USER_PERMISSIONS : []),
				  };
		}
		return undefined;
	},
});
const getContext = ({ userId, omitHandler }) => ({
	path: `/${EXISTING_SCOPE}/42/members`,
	params: {
		account: {
			userId,
		},
		route: {
			scopeId: 42,
		},
	},
	app: getApp(omitHandler),
});

describe('getScopePermissions', () => {
	const fut = getScopePermissions;

	it('should return an empty permissions array for users not in the scope', async () => {
		const app = getApp();
		const result = await fut(app, new ObjectId(), { id: 42, name: EXISTING_SCOPE });
		expect(result).to.deep.equal([]);
	});

	it("should return the user's permissions in the given scope", async () => {
		const app = getApp();
		const result = await fut(app, ALLOWED_USER_ID, { id: 42, name: EXISTING_SCOPE });
		expect(result).to.deep.equal(ALLOWED_USER_PERMISSIONS);
	});

	it('should fail if userId is not valid', async () => {
		const app = getApp();
		const examples = ['hjfsut34ruzgu', undefined, null, 672476734677374376434, []];
		const results = await Promise.all(examples.map((example) => fut(app, example, { id: 824, name: EXISTING_SCOPE })));
		expect(results).to.deep.equal([[], [], [], [], []]);
	});

	it('should throw an error if the scope does not exist', async () => {
		const app = getApp();
		try {
			await fut(app, new ObjectId(), { id: 823634, name: 'jellyBeans' });
			throw new Error('This should never happen');
		} catch (err) {
			expect(err).to.be.instanceOf(BadRequest);
			expect(err.message).to.include("no userPermission service for the scope 'jellyBeans'.");
		}
	});
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
			expect(err.message).to.equal(`There is no userPermission service for the scope '${EXISTING_SCOPE}'.`);
		}
	});

	it("should use the scope's userPermission service to resolve permissions", async () => {
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

		context.userId = new ObjectId().toString();
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
		const context = getContext({ userId: new ObjectId().toString() });
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
