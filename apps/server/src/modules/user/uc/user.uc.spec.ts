import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { LanguageType, PermissionService, RoleName, User } from '@shared/domain';
import { setupEntities, userFactory } from '@shared/testing';
import { UserService } from '@src/modules/user/service/user.service';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { BadRequestException } from '@nestjs/common';
import { ProvisioningUserOutputDto } from '@src/modules/provisioning/dto/provisioning-user-output.dto';
import { RoleUc } from '@src/modules/role/uc/role.uc';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { UserRepo } from '@shared/repo';
import { ConfigService } from '@nestjs/config';
import { UserUc } from './user.uc';

describe('UserUc', () => {
	let userUc: UserUc;
	let userService: DeepMocked<UserService>;
	let orm: MikroORM;
	let userRepo: DeepMocked<UserRepo>;
	let permissionService: DeepMocked<PermissionService>;
	let config: DeepMocked<ConfigService>;
	let roleUc: DeepMocked<RoleUc>;

	beforeAll(async () => {
		orm = await setupEntities();
	});

	afterAll(async () => {
		await orm.close();
	});

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UserUc,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: RoleUc,
					useValue: createMock<RoleUc>(),
				},
				{
					provide: UserRepo,
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

		userUc = module.get(UserUc);
		userService = module.get(UserService);
		roleUc = module.get(RoleUc);
		userRepo = module.get(UserRepo);
		permissionService = module.get(PermissionService);
		config = module.get(ConfigService);
	});

	it('should be defined', () => {
		expect(userUc).toBeDefined();
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
			await userUc.me(user.id);

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
			await userUc.patchLanguage(user.id, { language: LanguageType.DE });

			expect(userRepo.findById).toHaveBeenCalledWith(user.id);
			expect(userRepo.save).toHaveBeenCalledWith(user);
		});

		it('should throw an error if language is not activated', async () => {
			await expect(userUc.patchLanguage(user.id, { language: LanguageType.EN })).rejects.toThrow(BadRequestException);
		});
	});

	describe('save', () => {
		let userDto: UserDto;
		let roleDto: RoleDto;

		beforeEach(() => {
			roleDto = new RoleDto({
				id: 'roleId',
				name: RoleName.DEMO,
			});
			userDto = new UserDto({
				firstName: 'John',
				lastName: 'Doe',
				email: 'user@example.com',
				roleIds: [roleDto.id as string],
				schoolId: 'school123',
			});
		});

		it('should call the save method of userService', async () => {
			await userUc.save(userDto);

			expect(userService.createOrUpdate).toHaveBeenCalledWith(userDto);
		});

		it('should call the saveProvisioningUserOutputDto method of userService', async () => {
			roleUc.findByNames.mockResolvedValue(Promise.resolve([roleDto]));

			await userUc.saveProvisioningUserOutputDto(
				new ProvisioningUserOutputDto({
					id: userDto.id,
					email: userDto.email,
					firstName: userDto.firstName,
					lastName: userDto.lastName,
					roleNames: [RoleName.DEMO],
					schoolId: userDto.schoolId,
					externalId: userDto.externalId as string,
				})
			);

			expect(userService.createOrUpdate).toHaveBeenCalledWith(userDto);
		});
	});
});
