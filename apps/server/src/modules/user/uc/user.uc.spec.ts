import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LanguageType, PermissionService, User } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { setupEntities, userFactory } from '@shared/testing';
import { UserService } from '@src/modules/user/service/user.service';
import { UserUc } from './user.uc';

describe('UserUc', () => {
	let module: TestingModule;
	let userUc: UserUc;
	let userRepo: DeepMocked<UserRepo>;
	let permissionService: DeepMocked<PermissionService>;
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
		userRepo = module.get(UserRepo);
		permissionService = module.get(PermissionService);
		config = module.get(ConfigService);
		await setupEntities();
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
});
