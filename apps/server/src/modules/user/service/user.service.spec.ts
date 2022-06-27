import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { RoleRepo, UserRepo } from '@shared/repo';
import { LanguageType, PermissionService, Role, RoleName, User } from '@shared/domain';
import { MikroORM } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '@src/modules/user/service/user.service';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { UserMapper } from '@src/modules/user/mapper/user.mapper';

describe('UserService', () => {
	let service: UserService;
	let orm: MikroORM;

	let userRepo: DeepMocked<UserRepo>;
	let roleRepo: DeepMocked<RoleRepo>;
	let permissionService: DeepMocked<PermissionService>;
	let config: DeepMocked<ConfigService>;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UserService,
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
			],
		}).compile();
		service = module.get(UserService);

		userRepo = module.get(UserRepo);
		roleRepo = module.get(RoleRepo);
		permissionService = module.get(PermissionService);
		config = module.get(ConfigService);
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

		afterEach(() => {
			userRepo.findById.mockRestore();
			permissionService.resolvePermissions.mockRestore();
		});

		it('should provide information about the passed userId', async () => {
			await service.me(user.id);

			expect(userRepo.findById).toHaveBeenCalled();
			expect(permissionService.resolvePermissions).toHaveBeenCalledWith(user);
		});
	});

	describe('patchLanguage', () => {
		let user: User;

		beforeEach(() => {
			user = userFactory.buildWithId({ roles: [] });
			userRepo.findById.mockResolvedValue(user);
			userRepo.save.mockResolvedValue();
			config.get.mockReturnValue(['de']);
		});

		afterEach(() => {
			userRepo.findById.mockRestore();
			userRepo.save.mockRestore();
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

		beforeEach(() => {
			const roles: Role[] = [roleFactory.buildWithId(), roleFactory.buildWithId()];
			roleRepo.findByNames.mockImplementation((names: RoleName[]): Promise<Role[]> => {
				return Promise.resolve(roles.filter((role) => names.includes(role.name)));
			});
			user = userFactory.buildWithId({ roles });
			userRepo.findById.mockResolvedValue(user);
			userRepo.save.mockResolvedValue();
		});

		afterEach(() => {
			roleRepo.findByNames.mockRestore();
			userRepo.findById.mockRestore();
			userRepo.save.mockRestore();
		});

		it('should patch existing user', async () => {
			const userDto: UserDto = UserMapper.mapFromEntityToDto(user);

			await service.save(userDto);

			expect(userRepo.findById).toHaveBeenCalledWith(user.id);
			expect(userRepo.save).toHaveBeenCalledWith(user);
		});

		it('should save new user', async () => {
			const userDto: UserDto = UserMapper.mapFromEntityToDto(user);
			userDto.id = undefined;

			await service.save(userDto);
			expect(userRepo.save).toHaveBeenCalledWith(user);
		});
	});
});
