import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { MikroORM } from '@mikro-orm/core';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LanguageType, User } from '@shared/domain';
import { setupEntities, userFactory } from '@shared/testing';
import { UserService } from '@src/modules/user/service/user.service';
import { UserUc } from './user.uc';

describe('UserUc', () => {
	let userUc: UserUc;
	let userService: DeepMocked<UserService>;
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
			],
		}).compile();

		userUc = module.get(UserUc);
		userService = module.get(UserService);
		config = module.get(ConfigService);
	});

	it('should be defined', () => {
		expect(userUc).toBeDefined();
	});

	describe('me', () => {
		let user: User;

		beforeEach(() => {
			user = userFactory.buildWithId({ roles: [] });
		});

		it('should provide information about the passed userId', async () => {
			await userUc.me(user.id);

			expect(userService.me).toHaveBeenCalled();
			expect(userService.me).toHaveBeenCalledWith(user.id);
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
