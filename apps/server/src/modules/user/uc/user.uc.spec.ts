import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { EntityId, LanguageType, Permission, Role, RoleName, User } from '@shared/domain';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { UserService } from '@src/modules/user/service/user.service';
import { UserDto } from '@src/modules/user/uc/dto/user.dto';
import { BadRequestException } from '@nestjs/common';
import { ProvisioningUserOutputDto } from '@src/modules/provisioning/dto/provisioning-user-output.dto';
import { RoleUc } from '@src/modules/role/uc/role.uc';
import { RoleDto } from '@src/modules/role/service/dto/role.dto';
import { UserUc } from './user.uc';

describe('UserUc', () => {
	let userUc: UserUc;
	let userService: DeepMocked<UserService>;
	let orm: MikroORM;
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
			],
		}).compile();

		userUc = module.get(UserUc);
		userService = module.get(UserService);
		roleUc = module.get(RoleUc);
	});

	it('should be defined', () => {
		expect(userUc).toBeDefined();
	});

	describe('me', () => {
		let user: User;

		beforeEach(() => {
			const roles: Role[] = [
				roleFactory.buildWithId({ permissions: [Permission.ROLE_CREATE] }),
				roleFactory.buildWithId({ permissions: [Permission.ADD_SCHOOL_MEMBERS] }),
			];
			user = userFactory.buildWithId({ roles });
			userService.me.mockResolvedValue([user, [Permission.ROLE_CREATE, Permission.ADD_SCHOOL_MEMBERS]]);
		});

		it('should provide information about the passed userId', async () => {
			const result = await userUc.me(user.id);

			expect(userService.me).toHaveBeenCalledWith(user.id);
			expect(result).toEqual([user, [Permission.ROLE_CREATE, Permission.ADD_SCHOOL_MEMBERS]]);
		});
	});

	describe('patchLanguage', () => {
		let user: User;

		beforeEach(() => {
			user = userFactory.buildWithId();
			userService.patchLanguage.mockImplementation((userId: EntityId, newLanguage: LanguageType): Promise<boolean> => {
				return newLanguage === LanguageType.DE ? Promise.resolve(true) : Promise.reject(new BadRequestException());
			});
		});

		it('should patch language auf passed userId', async () => {
			const result = await userUc.patchLanguage(user.id, { language: LanguageType.DE });

			expect(userService.patchLanguage).toHaveBeenCalledWith(user.id, LanguageType.DE);
			expect(result).toBe(true);
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
			// Act
			await userUc.save(userDto);

			// Assert
			expect(userService.createOrUpdate).toHaveBeenCalledWith(userDto);
		});

		it('should call the saveProvisioningUserOutputDto method of userService', async () => {
			// Arrange
			roleUc.findByNames.mockResolvedValue(Promise.resolve([roleDto]));

			// Act
			await userUc.saveProvisioningUserOutputDto(
				new ProvisioningUserOutputDto({
					id: userDto.id,
					email: userDto.email,
					firstName: userDto.firstName,
					lastName: userDto.lastName,
					roleNames: [RoleName.DEMO],
					schoolId: userDto.schoolId,
				})
			);

			// Assert
			expect(userService.createOrUpdate).toHaveBeenCalledWith(userDto);
		});
	});
});
