import { ObjectId } from 'bson';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { setupEntities, userFactory } from '@shared/testing';
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
		const setup = () => {
			const user = userFactory.buildWithId();

			userRepo.findById.mockResolvedValueOnce(user);
			const spy = jest.spyOn(permissionContextRepo, 'findByContextReference').mockResolvedValue(null);

			return { user, spy };
		};

		it('should call permissionContextRepo', async () => {
			const { user, spy } = setup();
			const oid = new ObjectId();
			await expect(() => service.resolvePermissions(user, oid)).rejects.toThrow(NotFoundException);
			expect(spy).toBeCalledWith(oid);
		});
	});
});
