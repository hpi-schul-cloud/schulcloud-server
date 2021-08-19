const { expect } = require('chai');
const appPromise = require('../../../../src/app');
const { BadRequest } = require('../../../../src/errors');

const testObjects = require('../../helpers/testObjects')(appPromise);

describe.only('roles service', () => {
	let app;
	let rolesService;
	let server;

	before(async () => {
		app = await appPromise;
		rolesService = app.service('/roles');
		server = await app.listen(0);
	});

	after((done) => {
		server.close(done);
	});

	describe('UPDATE', () => {
		it('should not allow for cycles to be introduced', async () => {
			const superuser = await testObjects.createTestUser({ roles: ['superhero'] });
			const roleToChange = await testObjects.createTestRole({
				name: 'roletochange',
			});
			const parentRole = await testObjects.createTestRole({
				name: 'parentrole',
				roles: [roleToChange._id],
			});
			const parentsParentRole = await testObjects.createTestRole({
				name: 'parentsparent',
				roles: [parentRole._id],
			});
			const params = await testObjects.generateRequestParamsFromUser(superuser);
			const updateData = {
				name: 'roletochange',
				roles: [parentsParentRole._id],
			};
			try {
				const result = await rolesService.update(roleToChange.id, updateData, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(400);
			}
		});

		it('should should allow for subrole to be added', async () => {
			const superuser = await testObjects.createTestUser({ roles: ['superhero'] });
			const roleToChange = await testObjects.createTestRole({
				name: 'roletochange',
			});
			const parentRole = await testObjects.createTestRole({
				name: 'parentrole',
				roles: [roleToChange._id],
			});
			const subrole = await testObjects.createTestRole({
				name: 'subrole',
			});
			const params = await testObjects.generateRequestParamsFromUser(superuser);
			const updateData = {
				name: 'roletochange',
				roles: [subrole._id],
			};
			const result = await rolesService.update(roleToChange.id, updateData, params);
			expect(result).to.not.be.undefined;
			expect(result.id).to.not.be.undefined;
		});
	});

	describe('PATCH', () => {
		it('should not allow for cycles to be introduced', async () => {
			const superuser = await testObjects.createTestUser({ roles: ['superhero'] });
			const roleToChange = await testObjects.createTestRole({
				name: 'roletochange',
			});
			const parentRole = await testObjects.createTestRole({
				name: 'parentrole',
				roles: [roleToChange._id],
			});
			const parentsParentRole = await testObjects.createTestRole({
				name: 'parentsparent',
				roles: [parentRole._id],
			});
			const params = await testObjects.generateRequestParamsFromUser(superuser);
			const updateData = {
				roles: [parentsParentRole._id],
			};
			try {
				const result = await rolesService.patch(roleToChange.id, updateData, params);
				throw new Error('should have failed');
			} catch (err) {
				expect(err.message).to.not.equal('should have failed');
				expect(err.code).to.equal(400);
			}
		});

		it('should allow for roles to be passed as single string', async () => {
			const superuser = await testObjects.createTestUser({ roles: ['superhero'] });
			const roleToChange = await testObjects.createTestRole({
				name: 'roletochange',
			});
			const subRole = await testObjects.createTestRole({
				name: 'subrole',
			});
			const params = await testObjects.generateRequestParamsFromUser(superuser);
			const updateData = {
				roles: subRole._id.toString(),
			};
			const result = await rolesService.patch(roleToChange.id, updateData, params);
			expect(result).to.not.be.undefined;
			expect(result.id).to.not.be.undefined;
		});

		it('should should allow for subrole to be added', async () => {
			const superuser = await testObjects.createTestUser({ roles: ['superhero'] });
			const roleToChange = await testObjects.createTestRole({
				name: 'roletochange',
			});
			const parentRole = await testObjects.createTestRole({
				name: 'parentrole',
				roles: [roleToChange._id],
			});
			const subrole = await testObjects.createTestRole({
				name: 'subrole',
			});
			const params = await testObjects.generateRequestParamsFromUser(superuser);
			const updateData = {
				roles: [subrole._id],
			};
			const result = await rolesService.patch(roleToChange.id, updateData, params);
			expect(result).to.not.be.undefined;
			expect(result.id).to.not.be.undefined;
		});

		it('should should allow for roles to be ommitted', async () => {
			const superuser = await testObjects.createTestUser({ roles: ['superhero'] });
			const roleToChange = await testObjects.createTestRole({
				name: 'roletochange',
			});
			const parentRole = await testObjects.createTestRole({
				name: 'parentrole',
				roles: [roleToChange._id],
			});
			const params = await testObjects.generateRequestParamsFromUser(superuser);
			const updateData = {
				name: 'changedname',
			};
			const result = await rolesService.patch(roleToChange.id, updateData, params);
			expect(result).to.not.be.undefined;
			expect(result.id).to.not.be.undefined;
		});
	});

	afterEach(async () => {
		await testObjects.cleanup();
	});
});
