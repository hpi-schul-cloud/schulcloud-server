import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryDatabaseModule } from '@src/modules/database';
import { IPermissionsAndRoles } from '@shared/domain';
import { createCurrentTestUser } from '../utils';
import { UserRepo } from '../repo';
import { UserUC } from './user.uc';
import { RoleUC } from './role.uc';
import { ResolvedUser } from '../controller/dto';

describe('UserUC', () => {
	let module: TestingModule;
	let service: UserUC;
	let roleUC: RoleUC;
	let repo: UserRepo;

	beforeEach(async () => {
		module = await Test.createTestingModule({
			imports: [MongoMemoryDatabaseModule.forRoot()],
			providers: [
				UserUC,
				UserRepo,
				{
					provide: UserRepo,
					useValue: {
						findById() {},
					},
				},
				RoleUC,
				{
					provide: RoleUC,
					useValue: {
						resolvePermissionsByIdList() {},
					},
				},
			],
		}).compile();

		service = module.get(UserUC);
		roleUC = module.get(RoleUC);
		repo = module.get(UserRepo);
	});

	afterEach(async () => {
		await module.close();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
		expect(typeof service.getUserWithPermissions).toEqual('function');
	});

	describe('getUserWithPermissions', () => {
		it('should return valid solved and mapped typ', async () => {
			const permissions = ['A', 'B'] as string[];
			const { currentUser, user, roles } = createCurrentTestUser(permissions);

			const roleUCSpy = jest.spyOn(roleUC, 'resolvePermissionsByIdList').mockImplementation(() => {
				const result = { roles, permissions } as IPermissionsAndRoles;
				return Promise.resolve(result);
			});

			const userRepoSpy = jest.spyOn(repo, 'findById').mockImplementation(() => {
				return Promise.resolve(user);
			});

			const result = await service.getUserWithPermissions(currentUser);
			expect(result instanceof ResolvedUser).toBe(true);

			userRepoSpy.mockRestore();
			roleUCSpy.mockRestore();
		});
	});
});
