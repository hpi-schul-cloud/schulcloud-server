const { expect } = require('chai');
const appPromise = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(appPromise);


describe('userRoles', () => {
	let app;
	let userRoles;
	let server;
	const ROLES = {
		TEST: 'test',
		OTHER: 'other',
		NOTHING: 'nothing spezial',
	};
	const testPermissions = ['SINGING', 'DANCE_RAIN', 'WALK_LINES', 'RUN_FLOOR'];

	const otherPermissions = ['SITTING', 'SITTING_ON_CHAIR', 'SITTING_ON_DESK'];

	let testRole;
	let testRoleWithDiffrentPermissons;
	let otherRole;
	let testSchool;
	let testSchool2;
	let testUser;
	let testUser2;
	let otherUser;
	let accountTestUser;
	let accountTestUser2;
	let accountTestUserOther;

	const commonAccountData = {
		password: '$2a$10$wMuk7hpjULOEJrTW/CKtU.lIETKa.nEs8fncqLJ74SMeX.fzJACla',
		activated: true,
		createdAt: '2017-09-04T12:51:58.49Z',
	};

	const dataTestUser1 = {
		username: `${Date.now()}1@email.com`,
		...commonAccountData,
	};

	const dataTestUser2 = {
		username: `${Date.now()}2@email.com`,
		...commonAccountData,
	};

	const dataTestUserOther = {
		username: `${Date.now()}3@email.com`,
		...commonAccountData,
	};

	before(async () => {
		app = await appPromise;
		userRoles = app.service('/roles/user');
		server = await app.listen(0);
		testRole = await testObjects.createTestRole({
			name: ROLES.TEST,
			permissions: testPermissions,
		});

		testRoleWithDiffrentPermissons = await testObjects.createTestRole({
			name: ROLES.TEST,
			permissions: otherPermissions,
		});

		otherRole = await testObjects.createTestRole({
			name: ROLES.OTHER,
			permissions: otherPermissions,
		});

		testSchool = await testObjects.createTestSchool({
			permissions: { test: { SINGING: true } },
		});

		testSchool2 = await testObjects.createTestSchool({});

		testUser = await testObjects.createTestUser({
			schoolId: testSchool._id,
			roles: [testRole._id],
		});

		testUser2 = await testObjects.createTestUser({
			schoolId: testSchool._id,
			roles: [testRoleWithDiffrentPermissons._id],
		});

		otherUser = await testObjects.createTestUser({
			schoolId: testSchool2._id,
			roles: [otherRole._id],
		});

		accountTestUser = await testObjects.createTestAccount(dataTestUser1, null, testUser);
		accountTestUser2 = await testObjects.createTestAccount(dataTestUser2, null, testUser2);
		accountTestUserOther = await testObjects.createTestAccount(dataTestUserOther, null, otherUser);
	});

	after(async () => {
		await testObjects.cleanup();
		await server.close();
	});

	it('registered the service', () => {
		expect(userRoles).to.not.equal(undefined);
	});

	it('should get updated roles', async () => {
		const roles = await userRoles.get(testUser._id, { account: accountTestUser });
		const result = roles.map((role) => role.permissions);
		expect(result[0]).to.have.members(testRole.permissions);
	});

	it('should get role with new permisson', async () => {
		const roles = await userRoles.get(testUser2._id, { account: accountTestUser2 });
		const result = roles.map((role) => role.permissions);
		expect(result[0]).to.deep.equal([...testRoleWithDiffrentPermissons.permissions, testPermissions[0]]);
	});

	it('should get not updated role permissions', async () => {
		const roles = await userRoles.get(otherUser._id, { account: accountTestUserOther });
		const result = roles.map((role) => role.permissions);
		expect(result[0]).to.have.members(otherRole.permissions);
	});
});
