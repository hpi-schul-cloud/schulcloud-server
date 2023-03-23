import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EntityManager } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
	IFindOptions,
	LanguageType,
	Permission,
	PermissionService,
	Role,
	RoleName,
	SortOrder,
	User,
} from '@shared/domain';
import { UserDO } from '@shared/domain/domainobject/user.do';
import { RoleRepo, UserRepo } from '@shared/repo';
import { UserDORepo } from '@shared/repo/user/user-do.repo';
import { roleFactory, setupEntities, userDoFactory, userFactory } from '@shared/testing';
import { AccountService } from '@src/modules/account/services/account.service';
import { AccountDto } from '@src/modules/account/services/dto';
import { ICurrentUser } from '@src/modules/authentication';
import { RoleService } from '@src/modules/role/service/role.service';
import { SchoolService } from '@src/modules/school';
import { UserService } from '@src/modules/user/service/user.service';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { UserQuery } from './user-query.type';

describe('UserService', () => {
	let service: UserService;
	let module: TestingModule;

	let userRepo: DeepMocked<UserRepo>;
	let userDORepo: DeepMocked<UserDORepo>;
	let permissionService: DeepMocked<PermissionService>;
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
					provide: SchoolService,
					useValue: createMock<SchoolService>(),
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
					provide: RoleRepo,
					useValue: createMock<UserRepo>(),
				},
				{
					provide: PermissionService,
					useValue: createMock<PermissionService>(),
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
		permissionService = module.get(PermissionService);
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
		let user: User;

		beforeEach(() => {
			user = userFactory.buildWithId({ roles: [] });
			userRepo.findById.mockResolvedValue(user);
		});

		it('should provide information about the passed userId', async () => {
			await service.me(user.id);

			expect(userRepo.findById).toHaveBeenCalled();
			expect(permissionService.resolvePermissions).toHaveBeenCalledWith(user);
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
			const userDO: UserDO = new UserDO({
				firstName: 'firstName',
				lastName: 'lastName',
				email: 'email',
				schoolId: 'schoolId',
				roleIds: ['roleId'],
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
			it('should return an ICurrentUser', async () => {
				const systemId = 'systemId';
				const role: Role = roleFactory.buildWithId({
					name: RoleName.STUDENT,
					permissions: [Permission.DASHBOARD_VIEW],
				});
				const user: User = userFactory.buildWithId({ roles: [role] });
				const account: AccountDto = new AccountDto({
					id: 'accountId',
					systemId,
					username: 'username',
					createdAt: new Date(),
					updatedAt: new Date(),
					activated: true,
				});

				userRepo.findById.mockResolvedValue(user);
				accountService.findByUserIdOrFail.mockResolvedValue(account);

				const result: ICurrentUser = await service.getResolvedUser(user.id);

				expect(result).toEqual<ICurrentUser>({
					userId: user.id,
					systemId,
					schoolId: user.school.id,
					accountId: account.id,
					roles: [role.id],
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
			// Arrange
			const userDto: UserDto = { roleIds: [role.id], lastName: 'lastName' } as UserDto;

			// Act
			const result: string = await service.getDisplayName(userDto);

			// Assert
			expect(result).toEqual(userDto.lastName);
			expect(roleService.getProtectedRoles).toHaveBeenCalled();
		});

		it('should return the id when the user has a protected role and the last name is missing', async () => {
			// Arrange
			const userDto: UserDto = { roleIds: [role.id], id: 'id' } as UserDto;

			// Act
			const result: string = await service.getDisplayName(userDto);

			// Assert
			expect(result).toEqual(userDto.id);
			expect(roleService.getProtectedRoles).toHaveBeenCalled();
		});

		it('should return the first name and last name when the user has no protected role', async () => {
			// Arrange
			const userDto: UserDto = {
				id: 'id',
				lastName: 'lastName',
				firstName: 'firstName',
			} as UserDto;

			// Act
			const result: string = await service.getDisplayName(userDto);

			// Assert
			expect(result).toEqual(`${userDto.firstName} ${userDto.lastName}`);
			expect(roleService.getProtectedRoles).toHaveBeenCalled();
		});

		it('should return the id when the user has no protected role and last name is missing', async () => {
			// Arrange
			const userDto: UserDto = {
				id: 'id',
				firstName: 'firstName',
			} as UserDto;

			// Act
			const result: string = await service.getDisplayName(userDto);

			// Assert
			expect(result).toEqual(userDto.id);
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
				const user: UserDO = new UserDO({
					firstName: 'firstName',
					lastName: 'lastName',
					schoolId: 'schoolId',
					email: 'email',
					roleIds: ['roleId'],
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
				const user: UserDO = new UserDO({
					firstName: 'firstName',
					lastName: 'lastName',
					schoolId: 'schoolId',
					email: 'email',
					roleIds: ['roleId'],
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
});
