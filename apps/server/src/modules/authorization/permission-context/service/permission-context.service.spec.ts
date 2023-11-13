import { ObjectId } from 'bson';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { permissionContextFactory, roleFactory, setupEntities, userFactory } from '@shared/testing';
import { PermissionContextRepo, UserRepo } from '@shared/repo';
import { Permission } from '@shared/domain';
import { PermissionContextService } from './permission-context.service';

describe('PermissionContextService', () => {
	let service: PermissionContextService;
	let userRepo: DeepMocked<UserRepo>;
	let permissionContextRepo: DeepMocked<PermissionContextRepo>;

	beforeAll(async () => {
		await setupEntities();

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				PermissionContextService,
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				{
					provide: PermissionContextRepo,
					useValue: createMock<PermissionContextRepo>(),
				},
			],
		}).compile();

		service = await module.get(PermissionContextService);
		permissionContextRepo = await module.get(PermissionContextRepo);
		userRepo = await module.get(UserRepo);
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	describe('resolvePermissions', () => {
		describe('with no permissions', () => {
			const setup = () => {
				const user = userFactory.build();
				permissionContextFactory.build();

				userRepo.findById.mockResolvedValueOnce(user);
				const spy = jest.spyOn(permissionContextRepo, 'findByContextReference').mockResolvedValue([]);

				return { user, spy };
			};

			it('should call permissionContextRepo', async () => {
				const { user, spy } = setup();
				const oid = new ObjectId();
				const resolvedPermissions = await service.resolvePermissions(user, oid);
				expect(resolvedPermissions).toEqual([]);
				expect(spy).toBeCalledWith(oid);
			});
		});
	});

	describe('resolvePermissions', () => {
		describe('with complex setup', () => {
			const setup = () => {
				// NOTE setup 2 level role hierarchy
				// 2 level context hierarchy

				const contextReference = new ObjectId();

				const parentRole = roleFactory.buildWithId({ permissions: [Permission.ACCOUNT_CREATE] });
				const childRole = roleFactory.buildWithId({ permissions: [Permission.ACCOUNT_EDIT], roles: [parentRole] });

				const user = userFactory.withRole(childRole).buildWithId();

				const parentCtx = permissionContextFactory
					.withRole(parentRole)
					.buildWithId({ include_permissions: [Permission.ADD_SCHOOL_MEMBERS] });

				const childCtx = permissionContextFactory
					.withParentContext(parentCtx)
					.withContextReference(contextReference)
					.buildWithId({
						include_permissions: [Permission.ADMIN_EDIT],
						exclude_permissions: [Permission.ACCOUNT_CREATE],
					});

				userRepo.findById.mockResolvedValueOnce(user);
				permissionContextRepo.findByContextReference.mockResolvedValueOnce([childCtx]);

				return { user, contextReference };
			};

			it('should resolve nested permissions', async () => {
				const { user, contextReference } = setup();
				const resolvedPermissions = await service.resolvePermissions(user, contextReference);
				expect(resolvedPermissions.sort()).toEqual([Permission.ADMIN_EDIT, Permission.ADD_SCHOOL_MEMBERS].sort());
			});
		});
	});
});
