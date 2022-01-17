import { Test, TestingModule } from '@nestjs/testing';
import { ICurrentUser, PermissionService, User } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { ObjectId } from '@mikro-orm/mongodb';
import { setupEntities, userFactory } from '@shared/testing';
import { MikroORM } from '@mikro-orm/core';
import { UserController } from '.';

const mapToCurrentUser = (user: User) =>
	({
		userId: user.id,
		roles: [] as string[],
		schoolId: user.school.id,
		accountId: new ObjectId().toHexString(),
	} as ICurrentUser);

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
		const currentUser = mapToCurrentUser(user);
		const spyFindUser = jest.spyOn(userRepo, 'findById').mockImplementation(async () => Promise.resolve(user));
		const spyResolve = jest.spyOn(permissionService, 'resolveRolesAndPermissions').mockImplementation(() => [[], []]);

		await controller.me(currentUser);

		expect(spyFindUser).toHaveBeenCalled();
		expect(spyResolve).toHaveBeenCalled();

		spyFindUser.mockRestore();
		spyResolve.mockRestore();
	});
});
