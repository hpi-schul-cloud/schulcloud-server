import { ObjectId } from 'bson';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { Test, TestingModule } from '@nestjs/testing';
import { permissionContextFactory, setupEntities, userFactory } from '@shared/testing';
import { PermissionContextRepo, UserRepo } from '@shared/repo';
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
				const pCtx = permissionContextFactory.build();

				userRepo.findById.mockResolvedValueOnce(user);
				const spy = jest.spyOn(permissionContextRepo, 'findByContextReference').mockResolvedValue(pCtx);

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
});
