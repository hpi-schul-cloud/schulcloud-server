const { expect } = require('chai');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects');

describe('Role Service reload roles', async () => {
	let roleService;
	let server;
	let testHelper;

	before(async () => {
		server = await app.listen(0);
		roleService = app.service('roles');
		testHelper = testObjects(app);
	});

	after(async () => {
		await testHelper.cleanup();
		await server.close();
	});

	it('init should reload roles after it is already initialized', async () => {
		const rolesBefore = await roleService.roles;

		const testRole = await testHelper.createTestRole();
		roleService.init();

		const rolesAfter = await roleService.roles;
		const roleIsLoadToCache = rolesAfter.some((role) => role._id.toString() === testRole._id.toString());
		expect(roleIsLoadToCache, 'New role should exist.').to.be.true;

		await testHelper.cleanup();
		roleService.init();

		const rolesFinale = await roleService.roles;

		expect(rolesBefore, 'Should reset the data.').to.deep.equal(rolesFinale);
	});
});

describe('Role Service', async () => {
	let roleService;
	let server;
	let memoRole;
	let testHelper;

	before(async () => {
		server = await app.listen(0);
		roleService = app.service('roles');
		testHelper = testObjects(app);
	});

	after(async () => {
		await testHelper.cleanup();
		roleService.init();
		await server.close();
	});

	it('registered the service', () => {
		expect(roleService).to.not.equal(undefined);
	});

	it('should cache the roles', async () => {
		const cachedRoles = await roleService.roles;
		expect(Array.isArray(cachedRoles)).to.be.true;
	});

	it('should cache the roles', async () => {
		const cachedRoles = await roleService.roles;
		expect(Array.isArray(cachedRoles)).to.be.true;
	});

	it('find without permissions should work', async () => {
		const result = await roleService.find();
		memoRole = result.data[0];
		expect(result).to.not.be.undefined;
		expect(result.data, 'Should return a paginated result that includes data.').to.be.an('array').to.not.be.empty;
	});

	it('get without permissions should work', async () => {
		const result = await roleService.get(memoRole._id);
		expect(result, 'Should return the role.').to.deep.equal(memoRole);
	});

	it('getPermissionsByRoles for single role should work', async () => {
		const role = await testHelper.createTestRole({
			name: `${Date.now()}Test`,
			permissions: ['a'],
		});

		roleService.init();

		const perm = await roleService.getPermissionsByRoles(role._id);
		expect(perm).to.be.an('array').to.have.lengthOf(1).to.include('a');
	});

	it('getPermissionsByRoles for multiple roles should work', async () => {
		const role1 = await testHelper.createTestRole({
			name: `${Date.now()}Test`,
			permissions: ['a'],
		});

		const role2 = await testHelper.createTestRole({
			name: `${Date.now()}Test`,
			permissions: ['a', 'b'],
		});
		roleService.init();

		const perm = await roleService.getPermissionsByRoles([role1._id, role2._id]);
		expect(perm, 'All permissions should unique.').to.be.an('array').to.have.lengthOf(2);
		expect(perm).include('a');
		expect(perm).include('b');
	});
});
