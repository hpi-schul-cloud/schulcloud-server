import { permissionContextFactory, setupEntities, userFactory } from '@shared/testing';
import { PermissionCrud, UserDelta } from './permission-context.entity';

describe('PermissionContextEntity Entity', () => {
	beforeAll(async () => {
		await setupEntities();
	});

	describe('resolvedPermissions', () => {
		describe('with complex setup', () => {
			const setup = () => {
				// NOTE 2 level context hierarchy
				const user = userFactory.buildWithId();

				const parentUserDelta = new UserDelta([
					{
						userId: user.id,
						includedPermissions: [PermissionCrud.CREATE, PermissionCrud.READ],
						excludedPermissions: [],
					},
					{ userId: 'SOME OTHER USER', includedPermissions: [PermissionCrud.DELETE], excludedPermissions: [] },
				]);

				const parentCtx = permissionContextFactory.withUserDelta(parentUserDelta).buildWithId();

				const childUserDelta = new UserDelta([
					{
						userId: user.id,
						includedPermissions: [PermissionCrud.UPDATE],
						excludedPermissions: [PermissionCrud.CREATE],
					},
					{ userId: 'SOME OTHER USER', includedPermissions: [PermissionCrud.READ], excludedPermissions: [] },
				]);

				const permissionContext = permissionContextFactory
					.withUserDelta(childUserDelta)
					.withParentContext(parentCtx)
					.buildWithId();

				return { user, permissionContext };
			};

			it('should resolve nested permissions', async () => {
				const { user, permissionContext } = setup();
				const resolvedPermissions = await permissionContext.resolvedPermissions(user.id);
				expect(resolvedPermissions.sort()).toEqual([PermissionCrud.READ, PermissionCrud.UPDATE].sort());
			});
		});
	});
});
