import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LanguageType, PermissionService, User } from '@shared/domain';
import { UserRepo } from '@shared/repo';
import { setupEntities, userFactory } from '@shared/testing';
import { UserUC } from './user.uc';

describe('UserUc', () => {
	let service: UserUC;
	let userRepo: DeepMocked<UserRepo>;
	let permissionService: DeepMocked<PermissionService>;
	let orm: MikroORM;
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
				UserUC,
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

		service = module.get(UserUC);
		userRepo = module.get(UserRepo);
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
			await service.patchLanguage(user.id, { language: LanguageType.DE });

			expect(userRepo.findById).toHaveBeenCalledWith(user.id);
			expect(userRepo.save).toHaveBeenCalledWith(user);
		});

		it('should throw an error if language is not activated', async () => {
			await expect(service.patchLanguage(user.id, { language: LanguageType.EN })).rejects.toThrowError();
		});
	});
});
