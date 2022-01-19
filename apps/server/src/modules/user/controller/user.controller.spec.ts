import { Test, TestingModule } from '@nestjs/testing';
import { PermissionService } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { setupEntities, userFactory, mapUserToCurrentUser } from '@shared/testing';
import { MikroORM } from '@mikro-orm/core';
import { UserController } from '.';

describe('UserController', () => {
	let controller: UserController;
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
						resolveRolesAndPermissions() {
							throw new Error('Please write a mock for PermissionService.resolveRolesAndPermissions');
						},
					},
				},
			],
			controllers: [UserController],
		}).compile();

		controller = module.get(UserController);
		userRepo = module.get(UserRepo);
		permissionService = module.get(PermissionService);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	it('should provide information about the user', async () => {
		const user = userFactory.build();
		user.roles.set([]);
		const currentUser = mapUserToCurrentUser(user);
		const spyFindUser = jest.spyOn(userRepo, 'findById').mockImplementation(async () => Promise.resolve(user));
		const spyResolve = jest.spyOn(permissionService, 'resolveRolesAndPermissions').mockImplementation(() => [[], []]);

		await controller.me(currentUser);

		expect(spyFindUser).toHaveBeenCalled();
		expect(spyResolve).toHaveBeenCalled();

		spyFindUser.mockRestore();
		spyResolve.mockRestore();
	});
});
