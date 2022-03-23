import { Test, TestingModule } from '@nestjs/testing';
import { PermissionService } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { setupEntities, userFactory, mapUserToCurrentUser } from '@shared/testing';
import { MikroORM } from '@mikro-orm/core';
import { UserUC } from './user.uc';

describe('UserUc', () => {
	let service: UserUC;
	let userRepo: UserRepo;
	let permissionService: PermissionService;
	let orm: MikroORM;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UserUC,
				{
					provide: UserRepo,
					useValue: {
						findById() {
							throw new Error('Please write a mock for UserRepo.findById');
						},
					},
				},
				{
					provide: PermissionService,
					useValue: {
						resolvePermissions() {
							throw new Error('Please write a mock for PermissionService.resolvePermissions');
						},
					},
				},
			],
		}).compile();

		service = module.get(UserUC);
		userRepo = module.get(UserRepo);
		permissionService = module.get(PermissionService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	it('should provide information about the user', async () => {
		const user = userFactory.build();
		user.roles.set([]);
		const currentUser = mapUserToCurrentUser(user);
		const spyFindUser = jest.spyOn(userRepo, 'findById').mockImplementation(async () => Promise.resolve(user));
		const spyResolve = jest.spyOn(permissionService, 'resolvePermissions').mockImplementation(() => []);

		await service.me(currentUser.userId);

		expect(spyFindUser).toHaveBeenCalled();
		expect(spyResolve).toHaveBeenCalled();

		spyFindUser.mockRestore();
		spyResolve.mockRestore();
	});
});
