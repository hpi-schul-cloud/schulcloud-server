import { Test, TestingModule } from '@nestjs/testing';
import { createCurrentTestUser } from '../utils';
import { UserRepo } from '../repo';
import { UserUC } from './user.uc';
import { RoleUC } from './role.uc';
import { ResolvedUser } from '../controller/dto';
import { IPermissionsAndRoles } from '../entity';

describe('UserUC', () => {
	let service: UserUC;
	let roleUC: RoleUC;
	let repo: UserRepo;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
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
