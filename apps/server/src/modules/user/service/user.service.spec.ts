import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId, IFindOptions, LanguageType, Permission, Role, RoleName, SortOrder, User } from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { UserRepo } from '@shared/repo';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { roleFactory, setupEntities, userDoFactory, userFactory } from '@shared/testing';
import { AccountService } from '@modules/account/services/account.service';
import { AccountDto } from '@modules/account/services/dto';
import { RoleService } from '@modules/role/service/role.service';
import { UserService } from '@modules/user/service/user.service';
import { UserDto } from '@modules/user/uc/dto/user.dto';
import { OauthCurrentUser } from '@modules/authentication/interface';
import { UserQuery } from './user-query.type';

describe('UserService', () => {
	let service: UserService;
	let module: TestingModule;

	let userRepo: DeepMocked<UserRepo>;
	let userDORepo: DeepMocked<UserDORepo>;
	let config: DeepMocked<ConfigService>;
	let roleService: DeepMocked<RoleService>;
	let accountService: DeepMocked<AccountService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserService,
				{
					provide: EntityManager,
					useValue: createMock<EntityManager>(),
				},
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				{
					provide: UserDORepo,
					useValue: createMock<UserDORepo>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
				{
					provide: RoleService,
					useValue: createMock<RoleService>(),
				},
				{
					provide: AccountService,
					useValue: createMock<AccountService>(),
				},
			],
		}).compile();
		service = module.get(UserService);

		userRepo = module.get(UserRepo);
		userDORepo = module.get(UserDORepo);
		config = module.get(ConfigService);
		roleService = module.get(RoleService);
		accountService = module.get(AccountService);

		await setupEntities();
	});

	afterAll(async () => {
		await module.close();
	});

	afterEach(() => {
		jest.resetAllMocks();
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	describe('me', () => {
		it('should return an array with the user and its permissions', async () => {
			const permission = Permission.ACCOUNT_CREATE;
			const role = roleFactory.build({ permissions: [permission] });
			const user = userFactory.buildWithId({ roles: [role] });
			userRepo.findById.mockResolvedValue(user);
			const userSpy = jest.spyOn(user, 'resolvePermissions').mockReturnValueOnce([permission]);

			const result = await service.me(user.id);

			expect(result[0]).toEqual(user);
			expect(result[1]).toEqual([permission]);

			userSpy.mockRestore();
		});
	});

	describe('getUser', () => {
		let user: User;

		beforeEach(() => {
			user = userFactory.buildWithId({ roles: [] });
			userRepo.findById.mockResolvedValue(user);
		});

		it('should provide information about the passed userId', async () => {
			// Act
			const userDto: UserDto = await service.getUser(user.id);

			// Assert
			expect(userDto).toBeDefined();
			expect(userDto).toBeInstanceOf(UserDto);
			expect(userRepo.findById).toHaveBeenCalled();
		});
	});

	describe('findById', () => {
		beforeEach(() => {
			const userDO: UserDO = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.STUDENT }]).build({
				firstName: 'firstName',
				lastName: 'lastName',
				email: 'email',
				schoolId: 'schoolId',
				externalId: 'externalUserId',
			});
			userDORepo.findById.mockResolvedValue(userDO);
		});

		it('should provide the userDO', async () => {
			const result: UserDO = await service.findById('id');

			expect(result).toBeDefined();
			expect(result).toBeInstanceOf(UserDO);
		});
	});

	describe('getResolvedUser is called', () => {
		describe('when a resolved user is requested', () => {
			const setup = () => {
				const systemId = 'systemId';
				const role: Role = roleFactory.buildWithId({
					name: RoleName.STUDENT,
					permissions: [Permission.DASHBOARD_VIEW],
				});
				const user: UserDO = userDoFactory.buildWithId({ roles: [role] });
				const account: AccountDto = new AccountDto({
					id: 'accountId',
					systemId,
					username: 'username',
					createdAt: new Date(),
					updatedAt: new Date(),
					activated: true,
				});

				userDORepo.findById.mockResolvedValue(user);
				accountService.findByUserIdOrFail.mockResolvedValue(account);

				return {
					userId: user.id as string,
					user,
					account,
					role,
					systemId,
				};
			};

			it('should return the current user', async () => {
				const { userId, user, account, role, systemId } = setup();

				const result: OauthCurrentUser = await service.getResolvedUser(userId);

				expect(result).toEqual<OauthCurrentUser>({
					userId,
					systemId,
					schoolId: user.schoolId,
					accountId: account.id,
					roles: [role.id],
					isExternalUser: true,
				});
			});
		});
	});

	describe('getDisplayName', () => {
		let role: Role;

		beforeEach(() => {
			role = roleFactory.buildWithId();
			roleService.getProtectedRoles.mockResolvedValue([role]);
		});

		it('should return only the last name when the user has a protected role', async () => {
			const user: UserDO = userDoFactory.withRoles([{ id: role.id, name: RoleName.STUDENT }]).buildWithId({
				lastName: 'lastName',
			});

			const result: string = await service.getDisplayName(user);

			expect(result).toEqual(user.lastName);
			expect(roleService.getProtectedRoles).toHaveBeenCalled();
		});

		it('should return the first name and last name when the user has no protected role', async () => {
			const user: UserDO = userDoFactory.withRoles([{ id: 'unprotectedId', name: RoleName.STUDENT }]).buildWithId({
				lastName: 'lastName',
				firstName: 'firstName',
			});

			const result: string = await service.getDisplayName(user);

			expect(result).toEqual(`${user.firstName} ${user.lastName}`);
			expect(roleService.getProtectedRoles).toHaveBeenCalled();
		});
	});

	describe('patchLanguage', () => {
		let user: User;

		beforeEach(() => {
			user = userFactory.buildWithId({ roles: [] });
			userRepo.findById.mockResolvedValue(user);
			config.get.mockReturnValue(['de']);
		});

		it('should patch language auf passed userId', async () => {
			await service.patchLanguage(user.id, LanguageType.DE);

			expect(userRepo.findById).toHaveBeenCalledWith(user.id);
			expect(userRepo.save).toHaveBeenCalledWith(user);
		});

		it('should throw an error if language is not activated', async () => {
			await expect(service.patchLanguage(user.id, LanguageType.EN)).rejects.toThrowError();
		});
	});

	describe('save is called', () => {
		describe('when saving a new user', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).build({
					firstName: 'firstName',
					lastName: 'lastName',
					schoolId: 'schoolId',
					email: 'email',
				});

				userDORepo.save.mockResolvedValue(user);

				return {
					user,
				};
			};

			it('should call the userDORepo.save', async () => {
				const { user } = setup();

				await service.save(user);

				expect(userDORepo.save).toHaveBeenCalledWith(user);
			});

			it('should return the saved user', async () => {
				const { user } = setup();

				const result: UserDO = await service.save(user);

				expect(result).toEqual(user);
			});
		});
	});

	describe('findByExternalId is called', () => {
		describe('when a user with this external id exists', () => {
			it('should return the user', async () => {
				const user: UserDO = userDoFactory.withRoles([{ id: 'roleId', name: RoleName.USER }]).build({
					firstName: 'firstName',
					lastName: 'lastName',
					schoolId: 'schoolId',
					email: 'email',
					externalId: 'externalId',
				});

				userDORepo.findByExternalId.mockResolvedValue(user);

				const result: UserDO | null = await service.findByExternalId('externalId', 'systemId');

				expect(result).toEqual(user);
			});
		});

		describe('when a user with this external id does not exist', () => {
			it('should return null', async () => {
				userDORepo.findByExternalId.mockResolvedValue(null);

				const result: UserDO | null = await service.findByExternalId('externalId', 'systemId');

				expect(result).toEqual(null);
			});
		});
	});

	describe('findByEmail is called', () => {
		describe('when a user with this email exists', () => {
			it('should return the user', async () => {
				const user: User = userFactory.buildWithId();

				userRepo.findByEmail.mockResolvedValue([user]);

				const result: User[] = await service.findByEmail(user.email);

				expect(result).toEqual([user]);
			});
		});
	});

	describe('findUsers is called', () => {
		it('should call the repo with given query and options', async () => {
			const query: UserQuery = {
				schoolId: 'schoolId',
				isOutdated: true,
			};
			const options: IFindOptions<UserDO> = { order: { id: SortOrder.asc } };

			await service.findUsers(query, options);

			expect(userDORepo.find).toHaveBeenCalledWith(query, options);
		});
	});

	describe('saveAll is called', () => {
		it('should call the repo with given users', async () => {
			const users: UserDO[] = [userDoFactory.buildWithId()];

			await service.saveAll(users);

			expect(userDORepo.saveAll).toHaveBeenCalledWith(users);
		});
	});

	describe('deleteUser', () => {
		describe('when user is missing', () => {
			const setup = () => {
				const user: UserDO = userDoFactory.build({ id: undefined });
				const userId: EntityId = user.id as EntityId;

				userRepo.deleteUser.mockResolvedValue(0);

				return {
					userId,
				};
			};

			it('should return 0', async () => {
				const { userId } = setup();

				const result = await service.deleteUser(userId);

				expect(result).toEqual(0);
			});
		});

		describe('when deleting by userId', () => {
			const setup = () => {
				const user1: User = userFactory.asStudent().buildWithId();
				userFactory.asStudent().buildWithId();

				userRepo.findById.mockResolvedValue(user1);
				userRepo.deleteUser.mockResolvedValue(1);

				return {
					user1,
				};
			};

			it('should delete user by userId', async () => {
				const { user1 } = setup();

				const result = await service.deleteUser(user1.id);

				expect(userRepo.deleteUser).toHaveBeenCalledWith(user1.id);
				expect(result).toEqual(1);
			});
		});
	});
});
