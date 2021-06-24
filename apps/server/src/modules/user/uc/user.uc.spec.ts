import { Test, TestingModule } from '@nestjs/testing';
import { ObjectId } from '@mikro-orm/mongodb';
import { ICurrentUser } from '../../authentication/interface/jwt-payload';
import { ResolvedUserMapper } from '../mapper';
import { User, Role, IPermissionsAndRoles } from '../entity';
import { UserRepo } from '../repo';
import { UserUC } from './user.uc';
import { RoleUC } from './role.uc';
import { ResolvedUser } from '../controller/dto';

// TODO: move to testHelpers ?
const createCurrentTestUser = (
	initPermissions: string[]
): {
	currentUser: ICurrentUser;
	user: User;
	roles: Role[];
} => {
	const accountId = new ObjectId().toHexString();
	const schoolId = new ObjectId().toHexString();

	const permissions = initPermissions || ['A', 'B'];
	const roles = [new Role({ name: 'name', permissions })] as Role[];
	const roleIds = roles.map((role) => role.id);

	const user = new User({ email: `Date.now()@email.de`, roles, school: schoolId });
	const resolvedUser = ResolvedUserMapper.mapToResponse(user, permissions, roles);

	const currentUser = { userId: user.id, roles: roleIds, schoolId, accountId, user: resolvedUser } as ICurrentUser;
	return { currentUser, user, roles };
};

describe('TaskService', () => {
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
