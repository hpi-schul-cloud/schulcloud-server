import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { UserService } from '@modules/user/service/user.service';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from '@shared/domain/entity';
import { LanguageType, Permission } from '@shared/domain/interface';
import { UserRepo } from '@shared/repo';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { UserUc } from './user.uc';

describe('UserUc', () => {
	let module: TestingModule;
	let userUc: UserUc;
	let userRepo: DeepMocked<UserRepo>;
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
					provide: UserRepo,
					useValue: createMock<UserRepo>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
			],
		}).compile();

		userUc = module.get(UserUc);
		userRepo = module.get(UserRepo);
		config = module.get(ConfigService);
		await setupEntities();
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
});
