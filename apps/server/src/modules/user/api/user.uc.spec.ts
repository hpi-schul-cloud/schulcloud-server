import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { roleFactory } from '@modules/role/testing';
import { userDoFactory, userFactory } from '@modules/user/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { LanguageType, Permission } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { ObjectId } from 'bson';
import { USER_REPO, UserService } from '../domain';
import { User, type UserMikroOrmRepo } from '../repo';
import { UserUc } from './user.uc';

describe('UserUc', () => {
	let module: TestingModule;
	let userUc: UserUc;
	let userRepo: DeepMocked<UserMikroOrmRepo>;
	let userService: DeepMocked<UserService>;
	let config: DeepMocked<ConfigService>;

	afterAll(async () => {
		await module.close();
	});

	beforeAll(async () => {
		module = await Test.createTestingModule({
			providers: [
				UserUc,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: USER_REPO,
					useValue: createMock<UserMikroOrmRepo>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		userUc = module.get(UserUc);
		userRepo = module.get(USER_REPO);
		userService = module.get(UserService);
		config = module.get(ConfigService);
		await setupEntities([User]);
	});

	it('should be defined', () => {
		expect(userUc).toBeDefined();
	});

	describe('me', () => {
		it('should return an array with the user and its permissions', async () => {
			const permission = Permission.ACCOUNT_CREATE;
			const role = roleFactory.build({ permissions: [permission] });
			const user = userFactory.buildWithId({ roles: [role] });
			userRepo.findById.mockResolvedValue(user);
			const userSpy = jest.spyOn(user, 'resolvePermissions').mockReturnValueOnce([permission]);

			const result = await userUc.me(user.id);

			expect(result[0]).toEqual(user);
			expect(result[1]).toEqual([permission]);

			userRepo.findById.mockRestore();
			userSpy.mockRestore();
		});
	});

	describe('patchLanguage', () => {
		const setup = () => {
			const userId = new ObjectId().toHexString();
			const user = userDoFactory.buildWithId();
			userService.findById.mockResolvedValue(user);
			userService.save.mockResolvedValue(user);
			config.get.mockReturnValue(['de']);

			return {
				user,
				userId,
			};
		};

		it('should patch language auf passed userId', async () => {
			const { user, userId } = setup();
			await userUc.patchLanguage(userId, { language: LanguageType.DE });

			expect(userService.findById).toHaveBeenCalledWith(userId);
			expect(userService.save).toHaveBeenCalledWith(user);
		});

		it('should throw an error if language is not activated', async () => {
			const { userId } = setup();

			await expect(userUc.patchLanguage(userId, { language: LanguageType.EN })).rejects.toThrow(BadRequestException);
		});
	});
});
