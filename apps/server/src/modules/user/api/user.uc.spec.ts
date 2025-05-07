import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { userDoFactory } from '@modules/user/testing';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import { LanguageType } from '@shared/domain/interface';
import { setupEntities } from '@testing/database';
import { ObjectId } from 'bson';
import { UserService } from '../domain';
import { User, UserMikroOrmRepo } from '../repo';
import { UserUc } from './user.uc';

describe('UserUc', () => {
	let module: TestingModule;
	let userUc: UserUc;
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
					provide: UserMikroOrmRepo,
					useValue: createMock<UserMikroOrmRepo>(),
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
		await setupEntities([User]);
	});

	it('should be defined', () => {
		expect(userUc).toBeDefined();
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
