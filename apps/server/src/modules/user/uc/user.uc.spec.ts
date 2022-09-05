import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LanguageType, Role, User } from '@shared/domain';
import { roleFactory, setupEntities, userFactory } from '@shared/testing';
import { AuthorizationService } from '@src/modules/authorization';
import { UserService } from '@src/modules/user/service/user.service';
import { UserUc } from './user.uc';

describe('UserUc', () => {
	let userUc: UserUc;
	let userService: DeepMocked<UserService>;
	let authorizationService: DeepMocked<AuthorizationService>;
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
				UserUc,
				{
					provide: UserService,
					useValue: createMock<UserService>(),
				},
				{
					provide: ConfigService,
					useValue: createMock<ConfigService>(),
				},
				{
					provide: AuthorizationService,
					useValue: createMock<AuthorizationService>(),
				},
			],
		}).compile();

		userUc = module.get(UserUc);
		userService = module.get(UserService);
		authorizationService = module.get(AuthorizationService);
		config = module.get(ConfigService);
	});

	it('should be defined', () => {
		expect(userUc).toBeDefined();
	});

	describe('me', () => {
		let user: User;
		let role: Role;

		beforeEach(() => {
			role = roleFactory.buildWithId();
			user = userFactory.buildWithId({ roles: [role] });
		});

		it('should provide information about the passed userId', async () => {
			await userUc.me(user.id);

			expect(authorizationService.getUserWithPermissions).toHaveBeenCalledWith(user.id);
			expect(authorizationService.resolvePermissions).toHaveBeenCalledWith(user);
		});

		it('should provide information about the passed userId', async () => {
			authorizationService.getUserWithPermissions.mockResolvedValue(user);
			authorizationService.resolvePermissions.mockReturnValue([]);
			const result = await userUc.me(user.id);

			expect(result).toEqual([user, []]);
		});
	});

	describe('patchLanguage', () => {
		let user: User;

		beforeEach(() => {
			user = userFactory.buildWithId({ roles: [] });
			config.get.mockReturnValue(['de']);
		});

		it('should patch language auf passed userId', async () => {
			await userUc.patchLanguage(user.id, { language: LanguageType.DE });
			expect(userService.patchLanguage).toHaveBeenCalledWith(user.id, LanguageType.DE);
		});
	});
});
