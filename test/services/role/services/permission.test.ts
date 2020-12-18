import { expect } from 'chai';
import appPromise from '../../../../src/app';
import testObjectsImport from '../../helpers/testObjects'; 
const testObjects = testObjectsImport(appPromise);


describe('PermissionService', () => {
	let app;
	let permissionService;
	const ROLES = {
		TEST: 'test',
		OTHER: 'other',
		EXTENDED: 'extended',
		MULTIPLE: 'multiple',
		XX: 'xx',
		NOTHING: 'nothing spezial',
	};

	const testPermissions = ['SINGING', 'DANCE_RAIN', 'WALK_LINES', 'RUN_FLOOR'];

	const otherPermissions = ['SITTING', 'SITTING_ON_CHAIR', 'SITTING_ON_DESK'];

	const extendedPermissions = ['EAT_TO_KEEP_ALIVE'];

	const multipleExtendedPermission = ['WRITE_ON_BOARD'];

	const xxPermissions = ['GO_TO_TOILET'];

	before(async () => {
		app = await appPromise;
		permissionService = app.service('roles/:roleName/permissions');

		const testRole = await testObjects.createTestRole({
			name: ROLES.TEST,
			permissions: testPermissions,
		});

		const otherRole = await testObjects.createTestRole({
			name: ROLES.OTHER,
			permissions: otherPermissions,
		});

		const extendedRole = await testObjects.createTestRole({
			name: ROLES.EXTENDED,
			permissions: extendedPermissions,
			roles: [testRole._id],
		});

		const multipleExtendedRole = await testObjects.createTestRole({
			name: ROLES.MULTIPLE,
			permissions: multipleExtendedPermission,
			roles: [extendedRole._id, otherRole._id],
		});

		await testObjects.createTestRole({
			name: ROLES.XX,
			permissions: xxPermissions,
			roles: [multipleExtendedRole._id],
		});

		await testObjects.createTestRole({
			name: ROLES.NOTHING,
			roles: [otherRole._id],
		});
	});

	after(() => {
		testObjects.cleanup();
	});

	it('registered the service', () => {
		expect(permissionService).to.not.equal(undefined);
	});
	it('get Permissions without extended roles', async () => {
		const permissions = await permissionService.find({
			route: {
				roleName: ROLES.TEST,
			},
		});

		expect(permissions).to.have.members(testPermissions);
	});

	it('get Permissions with first level extended roles', async () => {
		const permissions = await permissionService.find({
			route: {
				roleName: ROLES.EXTENDED,
			},
		});

		expect(permissions).to.have.members([...testPermissions, ...extendedPermissions]);
	});

	it('get Permissions with multiple roles', async () => {
		const permissions = await permissionService.find({
			route: {
				roleName: ROLES.MULTIPLE,
			},
		});

		expect(permissions).to.have.members([
			...testPermissions,
			...extendedPermissions,
			...otherPermissions,
			...multipleExtendedPermission,
		]);
	});

	it('get Permissions with second level extended roles', async () => {
		const permissions = await permissionService.find({
			route: {
				roleName: ROLES.XX,
			},
		});

		expect(permissions).to.have.members([
			...testPermissions,
			...extendedPermissions,
			...otherPermissions,
			...multipleExtendedPermission,
			...xxPermissions,
		]);
	});

	it('get Permissions with extended but no own permissions', async () => {
		const permissions = await permissionService.find({
			route: {
				roleName: ROLES.NOTHING,
			},
		});

		expect(permissions).to.have.members([...otherPermissions]);
	});
});
