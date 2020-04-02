const { expect } = require('chai');
const app = require('../../../../src/app');
// const testObjects = require('../../helpers/testObjects')(app);

describe('Role Service', async () => {
	let roleService;
	let server;

	before(async () => {
		server = await app.listen(0);
		roleService = app.service('roles');
	});

	after(async () => {
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
});
