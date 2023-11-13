import { permissionContextFactory, setupEntities, userFactory } from '@shared/testing';
import { UserDelta } from './permission-context.entity';
import { Permission } from '../interface';

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
						included_permissions: [Permission.ACCOUNT_EDIT, Permission.ADMIN_EDIT],
						excluded_permissions: [],
					},
					{ userId: 'SOME OTHER USER', included_permissions: [Permission.ACCOUNT_CREATE], excluded_permissions: [] },
				]);

				const parentCtx = permissionContextFactory.withUserDelta(parentUserDelta).buildWithId();

				const childUserDelta = new UserDelta([
					{
						userId: user.id,
						included_permissions: [Permission.ADD_SCHOOL_MEMBERS],
						excluded_permissions: [Permission.ADMIN_EDIT],
					},
					{ userId: 'SOME OTHER USER', included_permissions: [Permission.BASE_VIEW], excluded_permissions: [] },
				]);

				const permissionContext = permissionContextFactory
					.withUserDelta(childUserDelta)
					.withParentContext(parentCtx)
					.buildWithId();

				return { user, permissionContext };
			};

			it('should resolve nested permissions', () => {
				const { user, permissionContext } = setup();
				const resolvedPermissions = permissionContext.resolvedPermissions(user);
				expect(resolvedPermissions.sort()).toEqual([Permission.ADD_SCHOOL_MEMBERS, Permission.ACCOUNT_EDIT].sort());
			});
		});
	});
});
