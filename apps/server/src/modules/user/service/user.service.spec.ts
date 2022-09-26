import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { RoleRepo, SchoolRepo, UserRepo } from '@shared/repo';
import { LanguageType, PermissionService, Role, RoleName, School, User } from '@shared/domain';
import { MikroORM } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { roleFactory, schoolFactory, setupEntities, userFactory } from '@shared/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '@src/modules/user/service/user.service';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { UserMapper } from '@src/modules/user/mapper/user.mapper';
import { RoleService } from '@src/modules/role/service/role.service';

describe('UserService', () => {
	let service: UserService;
	let orm: MikroORM;
	let module: TestingModule;

	let userRepo: DeepMocked<UserRepo>;
	let schoolRepo: DeepMocked<SchoolRepo>;
	let roleRepo: DeepMocked<RoleRepo>;
	let permissionService: DeepMocked<PermissionService>;
	let config: DeepMocked<ConfigService>;
	let roleService: DeepMocked<RoleService>;

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserService,
				{
					provide: SchoolRepo,
					useValue: createMock<SchoolRepo>(),
				},
				{
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
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
			],
		}).compile();
		service = module.get(UserService);

		userRepo = module.get(UserRepo);
		schoolRepo = module.get(SchoolRepo);
		roleRepo = module.get(RoleRepo);
		permissionService = module.get(PermissionService);
		config = module.get(ConfigService);
		roleService = module.get(RoleService);

		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
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

	describe('save', () => {
		let user: User;
		let roles: Role[];
		let school: School;
		const date: Date = new Date(2020, 1, 1);
		let capturedUser: User;

		beforeAll(() => {
			jest.useFakeTimers('modern');
			jest.setSystemTime(date);
		});

		afterAll(() => {
			jest.useRealTimers();
		});

		beforeEach(() => {
			roles = [roleFactory.buildWithId(), roleFactory.buildWithId()];
			roleRepo.findByNames.mockImplementation((names: RoleName[]): Promise<Role[]> => {
				return Promise.resolve(roles.filter((role) => names.includes(role.name)));
			});
			roleRepo.findByIds.mockImplementation((ids: string[]): Promise<Role[]> => {
				return Promise.resolve(roles.filter((role: Role) => ids.includes(role.id)));
			});
			user = userFactory.buildWithId({ roles });
			userRepo.findById.mockResolvedValue(user);
			userRepo.save.mockResolvedValue();
			userRepo.save.mockImplementation((entities: User[] | User): Promise<void> => {
				if (entities instanceof User) {
					capturedUser = entities;
				}
				return Promise.resolve();
			});
			school = schoolFactory.buildWithId();
			schoolRepo.findById.mockResolvedValue(school);
		});

		it('should patch existing user', async () => {
			const userDto: UserDto = UserMapper.mapFromEntityToDto(user);

			await service.createOrUpdate(userDto);

			expect(userDto.id).toEqual(user.id);
			expect(schoolRepo.findById).toHaveBeenCalledWith(userDto.schoolId);
			expect(userRepo.findById).toHaveBeenCalledWith(user.id);
			expect(userRepo.save).toHaveBeenCalledWith(user);
		});

		it('should save new user', async () => {
			const userDto: UserDto = {
				email: 'abc@def.xyz',
				firstName: 'Hans',
				lastName: 'Peter',
				roleIds: [roles[0].id, roles[1].id],
				schoolId: school.id,
			} as UserDto;

			await service.createOrUpdate(userDto);

			expect(schoolRepo.findById).toHaveBeenCalledWith(userDto.schoolId);
			expect(userRepo.findById).not.toHaveBeenCalled();
			expect(userRepo.save).toHaveBeenCalledWith(
				expect.objectContaining({
					id: null,
					createdAt: date,
					updatedAt: date,
					firstName: userDto.firstName,
					lastName: userDto.lastName,
					email: userDto.email,
					school,
				})
			);
			expect(capturedUser.roles.getItems().map((role: Role) => role.id)).toEqual(
				user.roles.getItems().map((role: Role) => role.id)
			);
		});
	});
});
