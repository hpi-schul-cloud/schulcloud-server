import { expect } from 'chai';
import appPromise from '../../../../src/app';
import testObjectsImport from '../../helpers/testObjects'; 
const testObjects = testObjectsImport(appPromise);


describe('userPermissions', () => {
	let app;
	let userPermissions;
	let server;
	const ROLES = {
		TEST: 'test',
		OTHER: 'other',
		NOTHING: 'nothing spezial',
	};
	const testPermissions = ['SINGING', 'DANCE_RAIN', 'WALK_LINES', 'RUN_FLOOR'];

	const otherPermissions = ['SITTING', 'SITTING_ON_CHAIR', 'SITTING_ON_DESK'];

	let testRole;
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
		username: 'testuser1@email.com',
		...commonAccountData,
	};

	const dataTestUser2 = {
		username: 'testuser2@email.com',
		...commonAccountData,
	};

	const dataTestUserOther = {
		username: 'testuserother@email.com',
		...commonAccountData,
	};

	before(async () => {
		app = await appPromise;
		userPermissions = app.service('/permissions/user');
		server = await app.listen(0);
		testRole = await testObjects.createTestRole({
			name: ROLES.TEST,
			permissions: testPermissions,
		});

		otherRole = await testObjects.createTestRole({
			name: ROLES.OTHER,
			permissions: otherPermissions,
		});

		testSchool = await testObjects.createTestSchool({
			permissions: { test: { SITTING: true } },
		});

		testSchool2 = await testObjects.createTestSchool({
			permissions: { other: { SITTING: true } },
		});

		testUser = await testObjects.createTestUser({
			schoolId: testSchool._id,
			roles: [testRole._id],
		});

		testUser2 = await testObjects.createTestUser({
			schoolId: testSchool2._id,
			roles: [otherRole._id],
		});

		otherUser = await testObjects.createTestUser({
			schoolId: testSchool._id,
			roles: [otherRole._id],
		});

		accountTestUser = await testObjects.createTestAccount(dataTestUser1, null, testUser);
		accountTestUser2 = await testObjects.createTestAccount(dataTestUser2, null, testUser2);
		accountTestUserOther = await testObjects.createTestAccount(dataTestUserOther, null, otherUser);
	});

	after((done) => {
		testObjects.cleanup();
		server.close(done);
	});

	it('registered the service', () => {
		expect(userPermissions).to.not.equal(undefined);
	});
	it('should get permissions from user role and school by role', async () => {
		const permissions = await userPermissions.get(testUser._id, { account: accountTestUser });
		expect(permissions).to.be.an('array');
		expect(permissions).to.deep.equal([...testPermissions, otherPermissions[0]]);
	});
	it('should get not duplicate permissions', async () => {
		const permissions = await userPermissions.get(testUser2._id, { account: accountTestUser2 });
		expect(permissions).to.be.an('array');
		expect(permissions).to.deep.equal(otherPermissions);
	});

	it('should get not updated permissions', async () => {
		const permissions = await userPermissions.get(otherUser._id, { account: accountTestUserOther });
		expect(permissions).to.be.an('array');
		expect(permissions).to.deep.equal(otherPermissions);
	});
});
