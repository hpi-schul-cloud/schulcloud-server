const { expect } = require('chai');
const app = require('../../../../src/app');
const testObjects = require('../../helpers/testObjects')(app);

const userRoles = app.service('/roles/user');

describe('userRoles', async () => {
	let server;
	const ROLES = {
		TEST: 'test',
		OTHER: 'other',
		EXTENDED: 'extended',
		MULTIPLE: 'multiple',
		XX: 'xx',
		NOTHING: 'nothing spezial',
	};
	const testPermissions = [
		'SINGING',
		'DANCE_RAIN',
		'WALK_LINES',
		'RUN_FLOOR',
	];

	const otherPermissions = [
		'SITTING',
		'SITTING_ON_CHAIR',
		'SITTING_ON_DESK',
	];

	let testRole;

	let testRoleWithDiffrentPermissons;

	let otherRole;

	let testSchool;

	let testSchoolWithoutRole;

	let testUser;

	let testUser2;

	let otherUser;

	before((done) => {
		server = app.listen(0, async () => {
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
				permissions: [testPermissions],
			});

			testSchoolWithoutRole = await testObjects.createTestSchool();

			testUser = await testObjects.createTestUser({
				schoolId: testSchool._id,
				roles: [testRole._id],
			});

			testUser2 = await testObjects.createTestUser({
				schoolId: testSchool._id,
				roles: [testRoleWithDiffrentPermissons._id],
			});

			otherUser = await testObjects.createTestUser({
				schoolId: testSchoolWithoutRole._id,
				roles: [otherRole._id],
			});
			done();
		});
	});

	after((done) => {
		testObjects.cleanup();
		server.close(done);
	});

	it('registered the service', () => {
		expect(userRoles).to.not.equal(undefined);
	});

	it('get updated roles', async () => {
		const roles = await userRoles.get({
			id: testUser._id,
		});
		const result = roles.map((role) => role.permissions);
		expect(result).to.equal(testRole.permissions);
	});

	it('should remove unnecessary permissions', async () => {
		const roles = await userRoles.get({
			id: testUser2._id,
		});
		const result = roles.map((role) => role.permissions);
		expect(result).to.not.equal(testRoleWithDiffrentPermissons.permissions);
	});

	it('should dont update userRoles', async () => {
		const roles = await userRoles.get({
			id: otherUser._id,
		});

		const result = roles.map((role) => role.permissions);
		expect(result).to.equal(otherRole.permissions);
	});
});
